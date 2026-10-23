import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { companyPageHtml } from './companies-page';

const app = new Hono();
app.use('*', cors({ origin: '*', allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowHeaders: ['Content-Type'] }));

// ==================== CARTA AKAUN STANDARD MALAYSIA (MPERS) ====================
const chartOfAccounts = {
  // 1000-1999: ASET
  '1001': { name: 'Tunai', type: 'asset', category: 'current' },
  '1002': { name: 'Bank', type: 'asset', category: 'current' },
  '1003': { name: 'Akaun Belum Terima (Debtor)', type: 'asset', category: 'current' },
  '1004': { name: 'Stok Inventori', type: 'asset', category: 'current' },
  '1101': { name: 'Peralatan & Perabot', type: 'asset', category: 'fixed' },
  '1102': { name: 'Kenderaan', type: 'asset', category: 'fixed' },
  // 2000-2999: LIABILITI
  '2001': { name: 'Akaun Belum Bayar (Creditor)', type: 'liability', category: 'current' },
  '2002': { name: 'KWSP (EPF)', type: 'liability', category: 'current' },
  '2003': { name: 'PERKESO (SOCSO)', type: 'liability', category: 'current' },
  '2004': { name: 'PCB (MTD)', type: 'liability', category: 'current' },
  '2005': { name: 'SST', type: 'liability', category: 'current' },
  '2101': { name: 'Pinjaman Bank', type: 'liability', category: 'long_term' },
  // 3000-3999: EKUITI
  '3001': { name: 'Modal', type: 'equity', category: 'equity' },
  '3002': { name: 'Ambilan', type: 'equity', category: 'equity' },
  '3003': { name: 'Untung Tertahan', type: 'equity', category: 'equity' },
  // 4000-4999: HASIL
  '4001': { name: 'Jualan', type: 'revenue', category: 'revenue' },
  '4002': { name: 'Hasil Perkhidmatan', type: 'revenue', category: 'revenue' },
  // 5000-5999: KOS JUALAN
  '5001': { name: 'Beli', type: 'expense', category: 'cogs' },
  '5002': { name: 'Angkutan Masuk', type: 'expense', category: 'cogs' },
  // 6000-6999: PERBELANJAAN OPERASI
  '6001': { name: 'Gaji & Upah', type: 'expense', category: 'operating' },
  '6002': { name: 'Sewa Premis', type: 'expense', category: 'operating' },
  '6003': { name: 'Utiliti (Air/Elektrik)', type: 'expense', category: 'operating' },
  '6004': { name: 'Susut Nilai', type: 'expense', category: 'operating' },
};

// ==================== E-INVOIS AUTO JOURNALS (DERIVED AT READ TIME) ====================
// Companies whose name matches an e-Invois seller get their sales journals
// derived automatically from the e-Invois D1 database (binding: EINVOIS).
// No duplicate data is written into mykira. Companies without e-Invois
// continue to use manual journal entries only.
//
// Sale journal (invoice issued):     Dr 1003 Akaun Belum Terima = total
//                                    Cr 4001 Jualan            = subtotal
//                                    Cr 2005 SST               = sst
// Receipt journal (invoice paid):    Dr 1002 Bank              = total
//                                    Cr 1003 Akaun Belum Terima = total

function toLines(row) {
  try {
    return typeof row.lines === 'string' ? JSON.parse(row.lines) : (row.lines || []);
  } catch (e) { return []; }
}

async function getDerivedJournals(einvoisDb, db, companyCode) {
  if (!einvoisDb || !companyCode) return [];
  try {
    // Resolve the company's name in Kira, then match e-Invois sellers by name
    const co = await db.prepare('SELECT entity_name FROM client_entries WHERE client_id = ?').bind(companyCode).first();
    if (!co || !co.entity_name) return [];
    const { results } = await einvoisDb.prepare(`
      SELECT id, invoice_no, date, buyer, subtotal, sst, total, status
      FROM invoices
      WHERE LOWER(json_extract(seller, '$.name')) = LOWER(?)
      ORDER BY date
    `).bind(co.entity_name).all();

    const journals = [];
    for (const inv of results) {
      let buyerName = 'Pelanggan';
      try { buyerName = JSON.parse(inv.buyer).name || 'Pelanggan'; } catch (e) {}
      const saleLines = [
        { account: '1003', accountName: 'Akaun Belum Terima (Debtor)', debit: inv.total, credit: 0 },
        { account: '4001', accountName: 'Jualan', debit: 0, credit: inv.subtotal },
      ];
      if (Number(inv.sst) > 0) {
        saleLines.push({ account: '2005', accountName: 'SST', debit: 0, credit: inv.sst });
      }
      journals.push({
        id: 'einv-sale-' + inv.id,
        company_id: companyCode,
        client_id: companyCode,
        date: inv.date,
        description: '[e-Invois] Invois ' + inv.invoice_no + ' - ' + buyerName,
        lines: saleLines,
        source: 'e-invois',
      });
      if (inv.status === 'paid') {
        journals.push({
          id: 'einv-pay-' + inv.id,
          company_id: companyCode,
          client_id: companyCode,
          date: inv.date,
          description: '[e-Invois] Bayaran Invois ' + inv.invoice_no + ' - ' + buyerName,
          lines: [
            { account: '1002', accountName: 'Bank', debit: inv.total, credit: 0 },
            { account: '1003', accountName: 'Akaun Belum Terima (Debtor)', debit: 0, credit: inv.total },
          ],
          source: 'e-invois',
        });
      }
    }
    return journals;
  } catch (e) {
    // e-Invois DB unavailable or schema missing — fall back to manual-only
    console.error('e-Invois derivation failed:', e.message);
    return [];
  }
}

// Merge manual journals (mykira) + derived e-Invois journals, oldest first.
// Used by the journal list and all report endpoints.
async function getAllJournals(c, companyCode) {
  let q = 'SELECT * FROM journal_entries';
  const params = [];
  if (companyCode) { q += ' WHERE company_id = ?'; params.push(companyCode); }
  q += ' ORDER BY date';
  const { results } = await c.env.DB.prepare(q).bind(...params).all();
  const manual = results.map(r => ({ ...r, lines: toLines(r), source: 'manual' }));
  const derived = await getDerivedJournals(c.env.EINVOIS, c.env.DB, companyCode);
  return [...manual, ...derived];
}

// ==================== SERVE UI ====================
app.get('/', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="ms">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>KiraEnterpriseV5.3 - Standard Malaysia</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', sans-serif; }
  body { background: #f4f6f9; color: #333; }
  .header { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; padding: 20px; text-align: center; }
  .nav { display: flex; background: #fff; border-bottom: 1px solid #ddd; overflow-x: auto; }
  .nav button { padding: 15px 20px; border: none; background: none; cursor: pointer; font-weight: 600; color: #555; white-space: nowrap; }
  .nav button.active { border-bottom: 3px solid #2a5298; color: #2a5298; }
  .container { max-width: 1200px; margin: 20px auto; padding: 0 20px; }
  .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 20px; }
  .card h2 { color: #1e3c72; margin-bottom: 15px; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
  th { background: #f8f9fa; color: #1e3c72; font-weight: 600; }
  .btn { padding: 10px 20px; background: #2a5298; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: 600; }
  .btn:hover { background: #1e3c72; }
  .form-group { margin-bottom: 15px; }
  .form-group label { display: block; margin-bottom: 5px; font-weight: 600; }
  .form-group input, .form-group select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .stat-box { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; border-left: 4px solid #2a5298; }
  .stat-box h3 { font-size: 1.5em; color: #1e3c72; }
  .total-row { font-weight: bold; background: #e9ecef; }
  .section { display: none; }
  .section.active { display: block; }
  textarea { font-family: 'Courier New', monospace; }
  .m-result { background: #f8f9fa; padding: 12px; border-radius: 5px; border-left: 4px solid #28a745; margin-top:10px; font-family: monospace; font-size: 13px; white-space: pre-wrap; max-height: 400px; overflow-y: auto; }
  .m-error { border-left-color: #dc3545; color: #dc3545; }
</style>
</head>
<body>
<div class="header"><h1>🔥 KiraEnterpriseV5.3</h1><p>Sistem Perakaun Standard Malaysia (MPERS)</p></div>
<div class="nav">
  <button class="active" onclick="showSection('dashboard')"> Papan Pemuka</button>
  <button onclick="showSection('coa')">📑 Carta Akaun</button>
  <button onclick="showSection('journal')">📝 Jurnal</button>
  <button onclick="showSection('ledger')">📖 Lejar Am</button>
  <button onclick="showSection('tb')">⚖️ Imbangan Duga</button>
  <button onclick="showSection('pl')">📈 Untung Rugi</button>
  <button onclick="showSection('bs')">📋 Kunci Kira-kira</button>
  <button onclick="showSection('maintenance')">🔧 Maintenance</button>
</div>
<div class="container">
  <div id="dashboard" class="section active">
    <div class="card">
      <h2>Senarai Syarikat</h2>
      <button class="btn" onclick="loadCompanies()">Muat Data</button>
      <div id="companyDropdown" style="margin-top:15px; display:none;">
        <div class="form-group">
          <label>Pilih Syarikat</label>
          <select id="dashboard_company" onchange="loadCompanyDetail(this.value)">
            <option value="">-- Pilih Syarikat --</option>
          </select>
        </div>
        <div id="companyDetail"></div>
      </div>
      <div id="companyList" style="margin-top:15px;"></div>
    </div>
  </div>
  <div id="coa" class="section">
    <div class="card"><h2>Carta Akaun (Chart of Accounts)</h2><div id="coaList"></div></div>
  </div>
  <div id="journal" class="section">
    <div class="card">
      <h2>Catatan Jurnal</h2>
      <div class="grid-2">
        <div>
          <h3>Tambah Jurnal Baru</h3>
          <div class="form-group"><label>Syarikat</label><select id="j_company"></select></div>
          <div class="form-group"><label>Tarikh</label><input type="date" id="j_date"></div>
          <div class="form-group"><label>Keterangan</label><input type="text" id="j_desc"></div>
          <div class="form-group"><label>Akaun Debit</label><select id="j_debit_acc"></select></div>
          <div class="form-group"><label>Jumlah Debit (RM)</label><input type="number" id="j_debit_amt" step="0.01"></div>
          <div class="form-group"><label>Akaun Kredit</label><select id="j_credit_acc"></select></div>
          <div class="form-group"><label>Jumlah Kredit (RM)</label><input type="number" id="j_credit_amt" step="0.01"></div>
          <button class="btn" onclick="saveJournal()">Simpan Jurnal</button>
        </div>
        <div><h3>Senarai Jurnal Terkini</h3><div id="journalList"></div></div>
      </div>
    </div>
  </div>
  <div id="ledger" class="section">
    <div class="card"><h2>Lejar Am (General Ledger)</h2><div class="form-group"><label>Pilih Syarikat</label><select id="l_company" onchange="loadLedger()"></select></div><div id="ledgerList"></div></div>
  </div>
  <div id="tb" class="section">
    <div class="card"><h2>Imbangan Duga (Trial Balance)</h2><div class="form-group"><label>Pilih Syarikat</label><select id="tb_company" onchange="loadTB()"></select></div><div id="tbList"></div></div>
  </div>
  <div id="pl" class="section">
    <div class="card"><h2>Penyata Untung Rugi (Profit & Loss)</h2><div class="form-group"><label>Pilih Syarikat</label><select id="pl_company" onchange="loadPL()"></select></div><div id="plList"></div></div>
  </div>
  <div id="bs" class="section">
    <div class="card"><h2>Kunci Kira-kira (Balance Sheet)</h2><div class="form-group"><label>Pilih Syarikat</label><select id="bs_company" onchange="loadBS()"></select></div><div id="bsList"></div></div>
  </div>
  <div id="maintenance" class="section">
    <div class="card">
      <h2>🔧 Maintenance (Query Console)</h2>
      <p style="margin-bottom:10px; color:#666;">Type any SQL query against the mykira database. Supports SELECT, INSERT, UPDATE, DELETE.</p>
      <div class="form-group">
        <label>SQL Query</label>
        <textarea id="m_query" rows="8" style="width:100%; padding:10px; font-family:monospace; border:1px solid #ddd; border-radius:5px; font-size:13px;" placeholder="SELECT * FROM client_entries LIMIT 10;"></textarea>
      </div>
      <button class="btn" onclick="executeMaintenance()">▶ Run Query</button>
      <button class="btn" style="background:#6c757d; margin-left:8px;" onclick="clearMaintenance()">🗑 Clear</button>
      <div id="maintenanceResult"></div>
    </div>
  </div>
</div>

<script>
const coa = ${JSON.stringify(chartOfAccounts)};

function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  event.target.classList.add('active');
  if(id === 'dashboard') loadCompanies();
  if(id === 'coa') loadCOA();
  if(id === 'journal') { loadJournals(); populateSelects(); }
  if(id === 'ledger') populateCompanySelect('l_company');
  if(id === 'tb') populateCompanySelect('tb_company');
  if(id === 'pl') populateCompanySelect('pl_company');
  if(id === 'bs') populateCompanySelect('bs_company');
  if(id === 'maintenance') { document.getElementById('m_query').value = ''; document.getElementById('maintenanceResult').innerHTML = ''; }
}

async function loadCompanies() {
  const res = await fetch('/api/clients');
  const data = await res.json();

  // Populate dropdown
  const dropdown = document.getElementById('dashboard_company');
  dropdown.innerHTML = '<option value="">-- Pilih Syarikat --</option>';
  data.data.forEach(c => {
    dropdown.innerHTML += '<option value="'+c.client_id+'">'+c.client_id+' - '+c.entity_name+'</option>';
  });
  document.getElementById('companyDropdown').style.display = 'block';
  document.getElementById('companyDetail').innerHTML = '';

  // Also show full table
  let html = '<table><tr><th>ID</th><th>Nama</th><th>Jenis</th><th>Status</th><th>Hasil</th><th>Belanja</th></tr>';
  data.data.forEach(c => {
    html += '<tr><td>'+c.client_id+'</td><td>'+c.entity_name+'</td><td>'+(c.entity_type||'-')+'</td><td>'+(c.status||'-')+'</td><td>RM '+Number(c.revenue).toLocaleString()+'</td><td>RM '+Number(c.expenses).toLocaleString()+'</td></tr>';
  });
  html += '</table>';
  document.getElementById('companyList').innerHTML = html;
}

async function loadCompanyDetail(code) {
  if(!code) { document.getElementById('companyDetail').innerHTML = ''; return; }
  const res = await fetch('/api/clients');
  const data = await res.json();
  const company = data.data.find(c => c.client_id === code);
  if(!company) return;

  let html = '<div class="grid-2" style="margin-top:15px;">';
  html += '<div class="stat-box"><h3>'+company.entity_name+'</h3><p>'+company.client_id+'</p></div>';
  html += '<div class="stat-box"><h3>Revenue (Hasil)</h3><p>RM '+Number(company.revenue).toLocaleString()+'</p></div>';
  html += '<div class="stat-box"><h3>Expenses (Belanja)</h3><p>RM '+Number(company.expenses).toLocaleString()+'</p></div>';
  html += '<div class="stat-box"><h3>Status</h3><p>'+(company.status||'-')+'</p></div>';
  html += '</div>';
  document.getElementById('companyDetail').innerHTML = html;
}

function loadCOA() {
  let html = '<table><tr><th>Kod</th><th>Nama Akaun</th><th>Jenis</th><th>Kategori</th></tr>';
  for(let code in coa) {
    const acc = coa[code];
    html += '<tr><td>'+code+'</td><td>'+acc.name+'</td><td>'+acc.type+'</td><td>'+acc.category+'</td></tr>';
  }
  html += '</table>';
  document.getElementById('coaList').innerHTML = html;
}

async function populateSelects() {
  const res = await fetch('/api/clients');
  const data = await res.json();
  const compSelect = document.getElementById('j_company');
  compSelect.innerHTML = data.data.map(c => '<option value="'+c.client_id+'">'+c.entity_name+'</option>').join('');
  
  const accOptions = Object.keys(coa).map(code => '<option value="'+code+'">'+code+' - '+coa[code].name+'</option>').join('');
  document.getElementById('j_debit_acc').innerHTML = accOptions;
  document.getElementById('j_credit_acc').innerHTML = accOptions;
}

async function populateCompanySelect(id) {
  const res = await fetch('/api/clients');
  const data = await res.json();
  document.getElementById(id).innerHTML = '<option value="">-- Pilih --</option>' + data.data.map(c => '<option value="'+c.client_id+'">'+c.entity_name+'</option>').join('');
}

async function saveJournal() {
  const body = {
    company_code: document.getElementById('j_company').value,
    date: document.getElementById('j_date').value,
    description: document.getElementById('j_desc').value,
    lines: [
      { account: document.getElementById('j_debit_acc').value, debit: parseFloat(document.getElementById('j_debit_amt').value), credit: 0 },
      { account: document.getElementById('j_credit_acc').value, debit: 0, credit: parseFloat(document.getElementById('j_credit_amt').value) }
    ]
  };
  if(body.lines[0].debit !== body.lines[1].credit) { alert('Debit dan Kredit mesti sama!'); return; }
  
  const res = await fetch('/api/journal-entries', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
  const result = await res.json();
  if(result.success) { alert('Jurnal disimpan!'); loadJournals(); } else { alert('Error: '+result.error); }
}

async function loadJournals() {
  const res = await fetch('/api/journal-entries');
  const data = await res.json();
  let html = '<table><tr><th>Tarikh</th><th>Keterangan</th><th>Debit</th><th>Kredit</th></tr>';
  data.data.forEach(j => {
    const d = j.lines.find(l => l.debit > 0);
    const cr = j.lines.find(l => l.credit > 0);
    html += '<tr><td>'+j.date+'</td><td>'+j.description+'</td><td>'+(d?coa[d.account]?.name+' (RM'+d.debit+')':'-')+'</td><td>'+(cr?coa[cr.account]?.name+' (RM'+cr.credit+')':'-')+'</td></tr>';
  });
  html += '</table>';
  document.getElementById('journalList').innerHTML = html;
}

async function loadLedger() {
  const code = document.getElementById('l_company').value;
  if(!code) return;
  const res = await fetch('/api/reports/ledger?company_code='+code);
  const data = await res.json();
  let html = '';
  for(let acc in data.data) {
    html += '<h3>'+acc+' - '+(coa[acc]?.name||acc)+'</h3><table><tr><th>Tarikh</th><th>Keterangan</th><th>Debit</th><th>Kredit</th><th>Baki</th></tr>';
    let bal = 0;
    data.data[acc].forEach(e => {
      bal += (e.debit - e.credit);
      html += '<tr><td>'+e.date+'</td><td>'+e.desc+'</td><td>'+(e.debit?e.debit:'-')+'</td><td>'+(e.credit?e.credit:'-')+'</td><td>'+bal.toFixed(2)+'</td></tr>';
    });
    html += '</table>';
  }
  document.getElementById('ledgerList').innerHTML = html || 'Tiada data.';
}

async function loadTB() {
  const code = document.getElementById('tb_company').value;
  if(!code) return;
  const res = await fetch('/api/reports/trial-balance?company_code='+code);
  const data = await res.json();
  let html = '<table><tr><th>Kod</th><th>Nama Akaun</th><th>Debit (RM)</th><th>Kredit (RM)</th></tr>';
  let tDr = 0, tCr = 0;
  for(let acc in data.data) {
    const dr = data.data[acc].debit; const cr = data.data[acc].credit;
    tDr += dr; tCr += cr;
    html += '<tr><td>'+acc+'</td><td>'+(coa[acc]?.name||acc)+'</td><td>'+(dr?dr.toFixed(2):'-')+'</td><td>'+(cr?cr.toFixed(2):'-')+'</td></tr>';
  }
  html += '<tr class="total-row"><td colspan="2">JUMLAH</td><td>RM '+tDr.toFixed(2)+'</td><td>RM '+tCr.toFixed(2)+'</td></tr></table>';
  html += '<p style="margin-top:10px; font-weight:bold; color:'+(Math.abs(tDr-tCr)<0.01?'green':'red')+'">'+(Math.abs(tDr-tCr)<0.01?'✅ SEIMBANG':'❌ TIDAK SEIMBANG')+'</p>';
  document.getElementById('tbList').innerHTML = html;
}

async function loadPL() {
  const code = document.getElementById('pl_company').value;
  if(!code) return;
  const res = await fetch('/api/reports/profit-loss?company_code='+code);
  const data = await res.json();
  let html = '<h3>HASIL</h3><table>';
  for(let acc in data.revenue) html += '<tr><td>'+(coa[acc]?.name||acc)+'</td><td style="text-align:right">RM '+data.revenue[acc].toFixed(2)+'</td></tr>';
  html += '<tr class="total-row"><td>Jumlah Hasil</td><td style="text-align:right">RM '+data.totalRevenue.toFixed(2)+'</td></tr></table>';
  html += '<h3 style="margin-top:20px">PERBELANJAAN</h3><table>';
  for(let acc in data.expenses) html += '<tr><td>'+(coa[acc]?.name||acc)+'</td><td style="text-align:right">RM '+data.expenses[acc].toFixed(2)+'</td></tr>';
  html += '<tr class="total-row"><td>Jumlah Perbelanjaan</td><td style="text-align:right">RM '+data.totalExpenses.toFixed(2)+'</td></tr></table>';
  html += '<div class="stat-box" style="margin-top:20px"><h3>'+(data.netProfit>=0?'UNTUNG BERSIH':'RUGI BERSIH')+'</h3><p>RM '+Math.abs(data.netProfit).toFixed(2)+'</p></div>';
  document.getElementById('plList').innerHTML = html;
}

async function loadBS() {
  const code = document.getElementById('bs_company').value;
  if(!code) return;
  const res = await fetch('/api/reports/balance-sheet?company_code='+code);
  const data = await res.json();
  let html = '<div class="grid-2"><div><h3>ASET</h3><table>';
  for(let acc in data.assets) html += '<tr><td>'+(coa[acc]?.name||acc)+'</td><td style="text-align:right">RM '+data.assets[acc].toFixed(2)+'</td></tr>';
  html += '<tr class="total-row"><td>Jumlah Aset</td><td style="text-align:right">RM '+data.totalAssets.toFixed(2)+'</td></tr></table></div>';
  html += '<div><h3>LIABILITI & EKUITI</h3><table>';
  for(let acc in data.liabilities) html += '<tr><td>'+(coa[acc]?.name||acc)+'</td><td style="text-align:right">RM '+data.liabilities[acc].toFixed(2)+'</td></tr>';
  for(let acc in data.equity) html += '<tr><td>'+(coa[acc]?.name||acc)+'</td><td style="text-align:right">RM '+data.equity[acc].toFixed(2)+'</td></tr>';
  html += '<tr class="total-row"><td>Jumlah Liabiliti & Ekuiti</td><td style="text-align:right">RM '+data.totalLiabEquity.toFixed(2)+'</td></tr></table></div></div>';
  document.getElementById('bsList').innerHTML = html;
}

async function executeMaintenance() {
  const query = document.getElementById('m_query').value.trim();
  if(!query) { alert('Masukkan query SQL!'); return; }
  const res = await fetch('/api/maintenance/query', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ query }) });
  const result = await res.json();
  let html = '';
  if(result.success) {
    if(result.data && result.data.length > 0) {
      const cols = Object.keys(result.data[0]);
      html += '<table><tr>' + cols.map(c => '<th>'+c+'</th>').join('') + '</tr>';
      result.data.forEach(row => {
        html += '<tr>' + cols.map(c => '<td>'+(row[c]!==null&&row[c]!==undefined?row[c]:'')+'</td>').join('') + '</tr>';
      });
      html += '</table>';
      html += '<p style="margin-top:8px; font-weight:bold; color:#2a5298;">Rows returned: '+result.data.length+' | Time: '+((result.time||0)+' ms')+'</p>';
    } else if(result.affected !== undefined) {
      html = '<div class="m-result">✅ Query executed successfully.<br>Rows affected: '+result.affected+' | Time: '+(result.time||0)+' ms</div>';
    } else {
      html = '<div class="m-result">✅ Query executed successfully. (No rows returned)<br>Time: '+(result.time||0)+' ms</div>';
    }
  } else {
    html = '<div class="m-result m-error">❌ Error: '+result.error+'</div>';
  }
  document.getElementById('maintenanceResult').innerHTML = html;
}

function clearMaintenance() {
  document.getElementById('m_query').value = '';
  document.getElementById('maintenanceResult').innerHTML = '';
}

loadCompanies();
</script>
</body>
</html>`);
});

// ==================== API ENDPOINTS ====================
app.get('/api/clients', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT 
        id AS client_id,
        name AS entity_name,
        'sdn_bhd' AS entity_type,
        CASE WHEN is_active = 1 THEN 'active' ELSE 'inactive' END AS status,
        0 AS revenue,
        0 AS expenses
      FROM companies 
      ORDER BY id
    `).all();
    return c.json({ success: true, data: results });
  } catch (e) { return c.json({ success: false, error: e.message }, 500); }
});

app.post('/api/journal-entries', async (c) => {
  try {
    const body = await c.req.json();
    const id = 'je-' + Date.now();
    await c.env.DB.prepare(`INSERT INTO journal_entries (id, company_id, client_id, date, description, lines) VALUES (?, ?, ?, ?, ?, ?)`).bind(id, body.company_code, body.company_code, body.date, body.description, JSON.stringify(body.lines)).run();
    return c.json({ success: true });
  } catch (e) { return c.json({ success: false, error: e.message }, 500); }
});

app.get('/api/journal-entries', async (c) => {
  try {
    const code = c.req.query('company_code');
    const all = await getAllJournals(c, code);
    // newest first for display
    all.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    return c.json({ success: true, data: all });
  } catch (e) { return c.json({ success: false, error: e.message }, 500); }
});

app.get('/api/reports/ledger', async (c) => {
  try {
    const code = c.req.query('company_code');
    const all = await getAllJournals(c, code);
    const ledger = {};
    all.forEach(r => {
      toLines(r).forEach(l => {
        if(!ledger[l.account]) ledger[l.account] = [];
        ledger[l.account].push({ date: r.date, desc: r.description, debit: l.debit, credit: l.credit });
      });
    });
    return c.json({ success: true, data: ledger });
  } catch (e) { return c.json({ success: false, error: e.message }, 500); }
});

app.get('/api/reports/trial-balance', async (c) => {
  try {
    const code = c.req.query('company_code');
    const all = await getAllJournals(c, code);
    const tb = {};
    all.forEach(r => {
      toLines(r).forEach(l => {
        if(!tb[l.account]) tb[l.account] = { debit: 0, credit: 0 };
        tb[l.account].debit += Number(l.debit||0);
        tb[l.account].credit += Number(l.credit||0);
      });
    });
    return c.json({ success: true, data: tb });
  } catch (e) { return c.json({ success: false, error: e.message }, 500); }
});

app.get('/api/reports/profit-loss', async (c) => {
  try {
    const code = c.req.query('company_code');
    const all = await getAllJournals(c, code);
    const revenue = {}, expenses = {};
    let totalRev = 0, totalExp = 0;
    all.forEach(r => {
      toLines(r).forEach(l => {
        const acc = chartOfAccounts[l.account];
        if(acc) {
          if(acc.type === 'revenue') { revenue[l.account] = (revenue[l.account]||0) + (l.credit - l.debit); totalRev += (l.credit - l.debit); }
          if(acc.type === 'expense') { expenses[l.account] = (expenses[l.account]||0) + (l.debit - l.credit); totalExp += (l.debit - l.credit); }
        }
      });
    });
    return c.json({ success: true, revenue, expenses, totalRevenue: totalRev, totalExpenses: totalExp, netProfit: totalRev - totalExp });
  } catch (e) { return c.json({ success: false, error: e.message }, 500); }
});

app.get('/api/reports/balance-sheet', async (c) => {
  try {
    const code = c.req.query('company_code');
    const all = await getAllJournals(c, code);
    const assets = {}, liabilities = {}, equity = {};
    let totalAssets = 0, totalLiabEquity = 0;
    all.forEach(r => {
      toLines(r).forEach(l => {
        const acc = chartOfAccounts[l.account];
        if(acc) {
          const bal = l.debit - l.credit;
          if(acc.type === 'asset') { assets[l.account] = (assets[l.account]||0) + bal; totalAssets += bal; }
          if(acc.type === 'liability') { liabilities[l.account] = (liabilities[l.account]||0) - bal; totalLiabEquity -= bal; }
          if(acc.type === 'equity') { equity[l.account] = (equity[l.account]||0) - bal; totalLiabEquity -= bal; }
        }
      });
    });
    // Add Net Profit to Equity
    let totalRev = 0, totalExp = 0;
    all.forEach(r => {
      toLines(r).forEach(l => {
        const acc = chartOfAccounts[l.account];
        if(acc) {
          if(acc.type === 'revenue') totalRev += (l.credit - l.debit);
          if(acc.type === 'expense') totalExp += (l.debit - l.credit);
        }
      });
    });
    equity['3003'] = (equity['3003']||0) + (totalRev - totalExp);
    totalLiabEquity += (totalRev - totalExp);

    return c.json({ success: true, assets, liabilities, equity, totalAssets, totalLiabEquity });
  } catch (e) { return c.json({ success: false, error: e.message }, 500); }
});

// ==================== COMPANY REGISTRATION SYSTEM ====================
// Pendaftaran syarikat dengan code unik + service charges + payment tracking
// (paid/unpaid, billing bulanan/tahunan)

function genUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : ((r & 0x3) | 0x8);
    return v.toString(16);
  });
}

function genCompanyCode(name) {
  // Kod unik ringkas: 2 huruf dari nama + 6 aksara rawak
  const letters = (name || 'CO').replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 2).padEnd(2, 'X');
  let rand = '';
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let i = 0; i < 6; i++) rand += chars.charAt(Math.floor(Math.random() * chars.length));
  return letters + rand;
}

async function uniqueCompanyCode(db, name) {
  for (let i = 0; i < 10; i++) {
    const code = genCompanyCode(name);
    const exists = await db.prepare('SELECT id FROM companies WHERE code = ?').bind(code).first();
    if (!exists) return code;
  }
  return genUUID().slice(0, 8).toUpperCase();
}

// ---- Companies ----

app.get('/api/companies', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT c.*,
        (SELECT COUNT(*) FROM company_services s WHERE s.company_id = c.id) AS service_count,
        (SELECT COALESCE(SUM(p.amount), 0) FROM service_payments p WHERE p.company_id = c.id AND p.status = 'paid') AS total_paid,
        (SELECT COALESCE(SUM(p.amount), 0) FROM service_payments p WHERE p.company_id = c.id AND p.status = 'unpaid') AS total_unpaid
      FROM companies c ORDER BY c.created_at DESC, c.name ASC
    `).all();
    return c.json({ success: true, data: results });
  } catch (e) { return c.json({ success: false, error: e.message }, 500); }
});

app.get('/api/companies/:code', async (c) => {
  try {
    const code = c.req.param('code');
    const company = await c.env.DB.prepare('SELECT * FROM companies WHERE code = ? OR id = ?').bind(code, code).first();
    if (!company) return c.json({ success: false, error: 'Syarikat tidak dijumpai' }, 404);
    return c.json({ success: true, data: company });
  } catch (e) { return c.json({ success: false, error: e.message }, 500); }
});

app.post('/api/companies', async (c) => {
  try {
    const body = await c.req.json();
    if (!body.name || !String(body.name).trim()) {
      return c.json({ success: false, error: 'Nama syarikat diperlukan' }, 400);
    }
    const id = body.id || genUUID();
    const code = body.code && String(body.code).trim()
      ? String(body.code).trim()
      : await uniqueCompanyCode(c.env.DB, body.name);

    const dup = await c.env.DB.prepare('SELECT id FROM companies WHERE code = ?').bind(code).first();
    if (dup) return c.json({ success: false, error: 'Kod syarikat sudah digunakan: ' + code }, 409);

    await c.env.DB.prepare(`
      INSERT INTO companies (id, code, name, type, tax_rate, address, phone, email, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      id, code, String(body.name).trim(),
      body.type || 'sdn_bhd_normal',
      body.tax_rate !== undefined ? Number(body.tax_rate) : 24.0,
      body.address || '', body.phone || '', body.email || '',
      body.status || 'active'
    ).run();

    const created = await c.env.DB.prepare('SELECT * FROM companies WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: created, message: 'Syarikat berjaya didaftarkan' });
  } catch (e) { return c.json({ success: false, error: e.message }, 500); }
});

app.put('/api/companies/:code', async (c) => {
  try {
    const code = c.req.param('code');
    const body = await c.req.json();
    const existing = await c.env.DB.prepare('SELECT * FROM companies WHERE code = ? OR id = ?').bind(code, code).first();
    if (!existing) return c.json({ success: false, error: 'Syarikat tidak dijumpai' }, 404);

    await c.env.DB.prepare(`
      UPDATE companies SET name = ?, type = ?, tax_rate = ?, address = ?, phone = ?, email = ?, status = ?
      WHERE id = ?
    `).bind(
      body.name !== undefined ? body.name : existing.name,
      body.type !== undefined ? body.type : existing.type,
      body.tax_rate !== undefined ? Number(body.tax_rate) : existing.tax_rate,
      body.address !== undefined ? body.address : existing.address,
      body.phone !== undefined ? body.phone : existing.phone,
      body.email !== undefined ? body.email : existing.email,
      body.status !== undefined ? body.status : existing.status,
      existing.id
    ).run();

    const updated = await c.env.DB.prepare('SELECT * FROM companies WHERE id = ?').bind(existing.id).first();
    return c.json({ success: true, data: updated, message: 'Maklumat syarikat dikemas kini' });
  } catch (e) { return c.json({ success: false, error: e.message }, 500); }
});

app.delete('/api/companies/:code', async (c) => {
  try {
    const code = c.req.param('code');
    const existing = await c.env.DB.prepare('SELECT * FROM companies WHERE code = ? OR id = ?').bind(code, code).first();
    if (!existing) return c.json({ success: false, error: 'Syarikat tidak dijumpai' }, 404);

    await c.env.DB.prepare('DELETE FROM service_payments WHERE company_id = ?').bind(existing.id).run();
    await c.env.DB.prepare('DELETE FROM company_services WHERE company_id = ?').bind(existing.id).run();
    await c.env.DB.prepare('DELETE FROM companies WHERE id = ?').bind(existing.id).run();

    return c.json({ success: true, message: 'Syarikat dipadam' });
  } catch (e) { return c.json({ success: false, error: e.message }, 500); }
});

// ---- Services ----

async function resolveCompany(db, code) {
  return db.prepare('SELECT * FROM companies WHERE code = ? OR id = ?').bind(code, code).first();
}

app.get('/api/companies/:code/services', async (c) => {
  try {
    const company = await resolveCompany(c.env.DB, c.req.param('code'));
    if (!company) return c.json({ success: false, error: 'Syarikat tidak dijumpai' }, 404);
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM company_services WHERE company_id = ? ORDER BY service_name ASC'
    ).bind(company.id).all();
    return c.json({ success: true, data: results });
  } catch (e) { return c.json({ success: false, error: e.message }, 500); }
});

app.post('/api/companies/:code/services', async (c) => {
  try {
    const company = await resolveCompany(c.env.DB, c.req.param('code'));
    if (!company) return c.json({ success: false, error: 'Syarikat tidak dijumpai' }, 404);
    const body = await c.req.json();
    if (!body.service_name || !String(body.service_name).trim()) {
      return c.json({ success: false, error: 'Nama perkhidmatan diperlukan' }, 400);
    }
    const id = 'svc-' + genUUID().slice(0, 12);
    const billing = String(body.billing_type || 'bulanan').toLowerCase();
    await c.env.DB.prepare(`
      INSERT INTO company_services (id, company_id, service_name, service_charge, billing_type, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      id, company.id, String(body.service_name).trim(),
      Number(body.service_charge) || 0,
      (billing === 'tahunan' || billing === 'annual') ? 'tahunan' : 'bulanan',
      body.status || 'active'
    ).run();
    const created = await c.env.DB.prepare('SELECT * FROM company_services WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: created, message: 'Perkhidmatan ditambah' });
  } catch (e) { return c.json({ success: false, error: e.message }, 500); }
});

app.put('/api/companies/:code/services/:serviceId', async (c) => {
  try {
    const company = await resolveCompany(c.env.DB, c.req.param('code'));
    if (!company) return c.json({ success: false, error: 'Syarikat tidak dijumpai' }, 404);
    const serviceId = c.req.param('serviceId');
    const existing = await c.env.DB.prepare(
      'SELECT * FROM company_services WHERE id = ? AND company_id = ?'
    ).bind(serviceId, company.id).first();
    if (!existing) return c.json({ success: false, error: 'Perkhidmatan tidak dijumpai' }, 404);

    const body = await c.req.json();
    let billing = existing.billing_type;
    if (body.billing_type !== undefined) {
      const b = String(body.billing_type).toLowerCase();
      billing = (b === 'tahunan' || b === 'annual') ? 'tahunan' : 'bulanan';
    }
    await c.env.DB.prepare(
      'UPDATE company_services SET service_name = ?, service_charge = ?, billing_type = ?, status = ? WHERE id = ?'
    ).bind(
      body.service_name !== undefined ? body.service_name : existing.service_name,
      body.service_charge !== undefined ? Number(body.service_charge) : existing.service_charge,
      billing,
      body.status !== undefined ? body.status : existing.status,
      serviceId
    ).run();
    const updated = await c.env.DB.prepare('SELECT * FROM company_services WHERE id = ?').bind(serviceId).first();
    return c.json({ success: true, data: updated, message: 'Perkhidmatan dikemas kini' });
  } catch (e) { return c.json({ success: false, error: e.message }, 500); }
});

app.delete('/api/companies/:code/services/:serviceId', async (c) => {
  try {
    const company = await resolveCompany(c.env.DB, c.req.param('code'));
    if (!company) return c.json({ success: false, error: 'Syarikat tidak dijumpai' }, 404);
    const serviceId = c.req.param('serviceId');
    const existing = await c.env.DB.prepare(
      'SELECT * FROM company_services WHERE id = ? AND company_id = ?'
    ).bind(serviceId, company.id).first();
    if (!existing) return c.json({ success: false, error: 'Perkhidmatan tidak dijumpai' }, 404);

    await c.env.DB.prepare('DELETE FROM service_payments WHERE service_id = ?').bind(serviceId).run();
    await c.env.DB.prepare('DELETE FROM company_services WHERE id = ?').bind(serviceId).run();
    return c.json({ success: true, message: 'Perkhidmatan dipadam' });
  } catch (e) { return c.json({ success: false, error: e.message }, 500); }
});

// ---- Payments ----

app.get('/api/companies/:code/payments', async (c) => {
  try {
    const company = await resolveCompany(c.env.DB, c.req.param('code'));
    if (!company) return c.json({ success: false, error: 'Syarikat tidak dijumpai' }, 404);
    const { results } = await c.env.DB.prepare(`
      SELECT p.*, s.service_name, s.billing_type
      FROM service_payments p
      LEFT JOIN company_services s ON s.id = p.service_id
      WHERE p.company_id = ?
      ORDER BY p.status ASC, p.due_date DESC
    `).bind(company.id).all();
    return c.json({ success: true, data: results });
  } catch (e) { return c.json({ success: false, error: e.message }, 500); }
});

app.post('/api/companies/:code/payments', async (c) => {
  try {
    const company = await resolveCompany(c.env.DB, c.req.param('code'));
    if (!company) return c.json({ success: false, error: 'Syarikat tidak dijumpai' }, 404);
    const body = await c.req.json();
    if (!body.service_id) return c.json({ success: false, error: 'Perkhidmatan diperlukan' }, 400);

    const service = await c.env.DB.prepare(
      'SELECT * FROM company_services WHERE id = ? AND company_id = ?'
    ).bind(body.service_id, company.id).first();
    if (!service) return c.json({ success: false, error: 'Perkhidmatan tidak dijumpai' }, 404);

    const id = 'pay-' + genUUID().slice(0, 12);
    const st = String(body.status || 'unpaid').toLowerCase();
    const status = st === 'paid' ? 'paid' : (st === 'pending' ? 'pending' : 'unpaid');
    await c.env.DB.prepare(`
      INSERT INTO service_payments (id, company_id, service_id, amount, payment_date, due_date, status, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      id, company.id, body.service_id,
      body.amount !== undefined ? Number(body.amount) : service.service_charge,
      body.payment_date || null,
      body.due_date || null,
      status,
      body.notes || ''
    ).run();
    const created = await c.env.DB.prepare('SELECT * FROM service_payments WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: created, message: 'Rekod bayaran ditambah' });
  } catch (e) { return c.json({ success: false, error: e.message }, 500); }
});

app.put('/api/companies/:code/payments/:paymentId', async (c) => {
  try {
    const company = await resolveCompany(c.env.DB, c.req.param('code'));
    if (!company) return c.json({ success: false, error: 'Syarikat tidak dijumpai' }, 404);
    const paymentId = c.req.param('paymentId');
    const existing = await c.env.DB.prepare(
      'SELECT * FROM service_payments WHERE id = ? AND company_id = ?'
    ).bind(paymentId, company.id).first();
    if (!existing) return c.json({ success: false, error: 'Rekod bayaran tidak dijumpai' }, 404);

    const body = await c.req.json();
    let status = existing.status;
    if (body.status !== undefined) {
      const s = String(body.status).toLowerCase();
      status = s === 'paid' ? 'paid' : (s === 'pending' ? 'pending' : 'unpaid');
    }
    let paymentDate = body.payment_date !== undefined ? body.payment_date : existing.payment_date;
    if (status === 'paid' && !paymentDate) paymentDate = new Date().toISOString().slice(0, 10);

    await c.env.DB.prepare(`
      UPDATE service_payments SET amount = ?, payment_date = ?, due_date = ?, status = ?, notes = ?
      WHERE id = ?
    `).bind(
      body.amount !== undefined ? Number(body.amount) : existing.amount,
      paymentDate || null,
      body.due_date !== undefined ? body.due_date : existing.due_date,
      status,
      body.notes !== undefined ? body.notes : existing.notes,
      paymentId
    ).run();

    const updated = await c.env.DB.prepare(
      'SELECT p.*, s.service_name FROM service_payments p LEFT JOIN company_services s ON s.id = p.service_id WHERE p.id = ?'
    ).bind(paymentId).first();
    return c.json({ success: true, data: updated, message: 'Rekod bayaran dikemas kini' });
  } catch (e) { return c.json({ success: false, error: e.message }, 500); }
});

app.delete('/api/companies/:code/payments/:paymentId', async (c) => {
  try {
    const company = await resolveCompany(c.env.DB, c.req.param('code'));
    if (!company) return c.json({ success: false, error: 'Syarikat tidak dijumpai' }, 404);
    const paymentId = c.req.param('paymentId');
    const existing = await c.env.DB.prepare(
      'SELECT * FROM service_payments WHERE id = ? AND company_id = ?'
    ).bind(paymentId, company.id).first();
    if (!existing) return c.json({ success: false, error: 'Rekod bayaran tidak dijumpai' }, 404);

    await c.env.DB.prepare('DELETE FROM service_payments WHERE id = ?').bind(paymentId).run();
    return c.json({ success: true, message: 'Rekod bayaran dipadam' });
  } catch (e) { return c.json({ success: false, error: e.message }, 500); }
});

app.get('/api/companies/:code/summary', async (c) => {
  try {
    const company = await resolveCompany(c.env.DB, c.req.param('code'));
    if (!company) return c.json({ success: false, error: 'Syarikat tidak dijumpai' }, 404);

    const services = (await c.env.DB.prepare(
      'SELECT * FROM company_services WHERE company_id = ? ORDER BY service_name ASC'
    ).bind(company.id).all()).results || [];
    const payments = (await c.env.DB.prepare(
      'SELECT p.*, s.service_name FROM service_payments p LEFT JOIN company_services s ON s.id = p.service_id WHERE p.company_id = ?'
    ).bind(company.id).all()).results || [];

    const paid = payments.filter(p => p.status === 'paid');
    const unpaid = payments.filter(p => p.status !== 'paid');
    const sum = (arr) => arr.reduce((t, p) => t + (Number(p.amount) || 0), 0);

    return c.json({
      success: true,
      data: {
        company,
        totals: {
          services: services.length,
          services_bulanan: services.filter(s => s.billing_type === 'bulanan').length,
          services_tahunan: services.filter(s => s.billing_type === 'tahunan').length,
          payments: payments.length,
          payments_paid: paid.length,
          payments_unpaid: unpaid.length,
          total_paid: sum(paid),
          total_unpaid: sum(unpaid),
          monthly_recurring: services.filter(s => s.billing_type === 'bulanan').reduce((t, s) => t + (Number(s.service_charge) || 0), 0),
          annual_recurring: services.filter(s => s.billing_type === 'tahunan').reduce((t, s) => t + (Number(s.service_charge) || 0), 0),
        },
      },
    });
  } catch (e) { return c.json({ success: false, error: e.message }, 500); }
});

// ==================== UI: COMPANY REGISTRATION PAGE ====================
app.get('/companies', (c) => {
  return c.html(companyPageHtml());
});

// ==================== MAINTENANCE / DEBUG ENDPOINT ====================
// Execute arbitrary SQL queries against the mykira D1 database.
// Supports SELECT, INSERT, UPDATE, DELETE and PRAGMA commands.

app.post('/api/maintenance/query', async (c) => {
  try {
    const body = await c.req.json();
    const query = String(body.query || '').trim();
    if(!query) return c.json({ success: false, error: 'Query is empty' }, 400);

    const upper = query.toUpperCase();
    const isSelect = upper.startsWith('SELECT') || upper.startsWith('PRAGMA') || upper.startsWith('EXPLAIN');

    const start = Date.now();
    let data, affected;

    if(isSelect) {
      const { results } = await c.env.DB.prepare(query).all();
      data = results;
    } else {
      const { success, changes } = await c.env.DB.prepare(query).run();
      affected = changes;
    }

    const elapsed = Date.now() - start;
    return c.json({ success: true, data: data || null, affected: affected ?? undefined, time: elapsed });
  } catch (e) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

export default app;