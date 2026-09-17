import { Hono } from 'hono';
import { cors } from 'hono/cors';

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
</div>
<div class="container">
  <div id="dashboard" class="section active">
    <div class="card"><h2>Senarai Syarikat</h2><button class="btn" onclick="loadCompanies()">Muat Data</button><div id="companyList" style="margin-top:15px;"></div></div>
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
}

async function loadCompanies() {
  const res = await fetch('/api/clients');
  const data = await res.json();
  let html = '<table><tr><th>ID</th><th>Nama</th><th>Hasil</th><th>Belanja</th></tr>';
  data.data.forEach(c => {
    html += '<tr><td>'+c.client_id+'</td><td>'+c.entity_name+'</td><td>RM '+Number(c.revenue).toLocaleString()+'</td><td>RM '+Number(c.expenses).toLocaleString()+'</td></tr>';
  });
  html += '</table>';
  document.getElementById('companyList').innerHTML = html;
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

loadCompanies();
</script>
</body>
</html>`);
});

// ==================== API ENDPOINTS ====================
app.get('/api/clients', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`SELECT client_id, entity_name, entity_type, status, COALESCE(json_extract(company_meta, '$.revenue'), 0) AS revenue, COALESCE(json_extract(company_meta, '$.expenses'), 0) AS expenses FROM client_entries ORDER BY client_id`).all();
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
    let q = 'SELECT * FROM journal_entries';
    const params = [];
    if(code) { q += ' WHERE company_id = ?'; params.push(code); }
    q += ' ORDER BY date DESC';
    const { results } = await c.env.DB.prepare(q).bind(...params).all();
    return c.json({ success: true, data: results.map(r => ({...r, lines: JSON.parse(r.lines)})) });
  } catch (e) { return c.json({ success: false, error: e.message }, 500); }
});

app.get('/api/reports/ledger', async (c) => {
  try {
    const code = c.req.query('company_code');
    const { results } = await c.env.DB.prepare('SELECT * FROM journal_entries WHERE company_id = ? ORDER BY date').bind(code).all();
    const ledger = {};
    results.forEach(r => {
      const lines = JSON.parse(r.lines);
      lines.forEach(l => {
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
    const { results } = await c.env.DB.prepare('SELECT lines FROM journal_entries WHERE company_id = ?').bind(code).all();
    const tb = {};
    results.forEach(r => {
      JSON.parse(r.lines).forEach(l => {
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
    const { results } = await c.env.DB.prepare('SELECT lines FROM journal_entries WHERE company_id = ?').bind(code).all();
    const revenue = {}, expenses = {};
    let totalRev = 0, totalExp = 0;
    results.forEach(r => {
      JSON.parse(r.lines).forEach(l => {
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
    const { results } = await c.env.DB.prepare('SELECT lines FROM journal_entries WHERE company_id = ?').bind(code).all();
    const assets = {}, liabilities = {}, equity = {};
    let totalAssets = 0, totalLiabEquity = 0;
    results.forEach(r => {
      JSON.parse(r.lines).forEach(l => {
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
    results.forEach(r => {
      JSON.parse(r.lines).forEach(l => {
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

export default app;