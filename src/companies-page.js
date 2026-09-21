// Company Registration UI page (KiraEnterprise)
// Dieksport sebagai function yang pulangkan HTML penuh.

export function companyPageHtml() {
  return `<!DOCTYPE html>
<html lang="ms">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pendaftaran Syarikat - KiraEnterprise</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; font-family:'Segoe UI',sans-serif; }
  body { background:#f4f6f9; color:#333; }
  .header { background:linear-gradient(135deg,#1e3c72 0%,#2a5298 100%); color:#fff; padding:20px; text-align:center; }
  .header h1 { font-size:22px; }
  .header p { font-size:13px; opacity:.85; margin-top:4px; }
  .nav { display:flex; background:#fff; border-bottom:1px solid #ddd; overflow-x:auto; }
  .nav button { padding:14px 18px; border:none; background:none; cursor:pointer; font-weight:600; color:#555; white-space:nowrap; font-size:14px; }
  .nav button.active { border-bottom:3px solid #2a5298; color:#2a5298; }
  .container { max-width:1200px; margin:18px auto; padding:0 14px; }
  .card { background:#fff; padding:18px; border-radius:8px; box-shadow:0 2px 4px rgba(0,0,0,.05); margin-bottom:18px; }
  .card h2 { color:#1e3c72; margin-bottom:12px; border-bottom:2px solid #f0f0f0; padding-bottom:8px; font-size:17px; }
  label { display:block; font-size:12px; color:#666; margin-bottom:4px; font-weight:600; }
  input, select { width:100%; padding:10px; border:1px solid #ddd; border-radius:6px; font-size:15px; margin-bottom:10px; }
  .row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .row3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; }
  .btn { padding:11px 18px; background:#2a5298; color:#fff; border:none; border-radius:6px; cursor:pointer; font-weight:600; font-size:14px; }
  .btn:hover { background:#1e3c72; }
  .btn-green { background:#0f9d58; } .btn-green:hover { background:#0b7a44; }
  .btn-red { background:#d93025; } .btn-red:hover { background:#b3261e; }
  .btn-sm { padding:6px 10px; font-size:12px; }
  table { width:100%; border-collapse:collapse; }
  th, td { padding:10px; text-align:left; border-bottom:1px solid #eee; font-size:14px; }
  th { background:#f8f9fa; color:#1e3c72; font-weight:600; font-size:13px; }
  .code { font-family:monospace; background:#eef3fb; color:#1e3c72; padding:2px 7px; border-radius:4px; font-weight:700; }
  .badge { padding:3px 9px; border-radius:12px; font-size:11px; font-weight:700; }
  .paid { background:#e6f4ea; color:#0b7a44; }
  .unpaid { background:#fce8e6; color:#b3261e; }
  .pending { background:#fef7e0; color:#a5670a; }
  .bulanan { background:#e8f0fe; color:#1a56b8; }
  .tahunan { background:#f3e8fd; color:#6b21a8; }
  .stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:12px; }
  .stat { background:#f8f9fa; padding:14px; border-radius:8px; border-left:4px solid #2a5298; }
  .stat .lbl { font-size:11px; color:#666; text-transform:uppercase; letter-spacing:.5px; }
  .stat .val { font-size:20px; font-weight:700; color:#1e3c72; margin-top:4px; }
  .msg { padding:10px; border-radius:6px; margin-bottom:12px; font-size:14px; display:none; }
  .msg.ok { background:#e6f4ea; color:#0b7a44; display:block; }
  .msg.err { background:#fce8e6; color:#b3261e; display:block; }
  .muted { color:#888; font-size:13px; }
  .actions { display:flex; gap:6px; flex-wrap:wrap; }
  @media (max-width:640px){ .row,.row3{ grid-template-columns:1fr; } th,td{ font-size:13px; padding:8px; } }
</style>
</head>
<body>
<div class="header">
  <h1>🏢 Pendaftaran Syarikat</h1>
  <p>Registrasi syarikat + caj perkhidmatan (bulanan/tahunan) + tracking bayaran</p>
</div>
<div class="nav">
  <button id="tab-companies" class="active" onclick="showTab('companies')">Syarikat</button>
  <button id="tab-services" onclick="showTab('services')">Perkhidmatan</button>
  <button id="tab-payments" onclick="showTab('payments')">Pembayaran</button>
  <button id="tab-summary" onclick="showTab('summary')">Ringkasan</button>
</div>
<div class="container">
  <div id="msg" class="msg"></div>
  <div id="err" class="msg"></div>
  <div class="card">
    <label>Syarikat Dipilih</label>
    <select id="companySelect" onchange="onCompanyChange()">
      <option value="">-- Pilih syarikat --</option>
    </select>
    <p class="muted" id="selectedInfo">Belum ada syarikat dipilih.</p>
  </div>
  <div id="page-companies"></div>
  <div id="page-services" style="display:none"></div>
  <div id="page-payments" style="display:none"></div>
  <div id="page-summary" style="display:none"></div>
</div>
<script>
let companies = [];
let selectedCode = '';
let services = [];
let payments = [];

function money(n){ return 'RM ' + (Number(n)||0).toFixed(2); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function showMsg(t){ const m=document.getElementById('msg'); m.textContent=t; m.className='msg ok'; setTimeout(()=>{m.className='msg';},3500); }
function showErr(t){ const m=document.getElementById('err'); m.textContent=t; m.className='msg err'; setTimeout(()=>{m.className='msg';},5000); }
function showTab(tab){
  ['companies','services','payments','summary'].forEach(t=>{
    document.getElementById('tab-'+t).className = (t===tab?'active':'');
    document.getElementById('page-'+t).style.display = (t===tab?'block':'none');
  });
}
async function api(path, opts){
  const res = await fetch(path, Object.assign({headers:{'Content-Type':'application/json'}}, opts||{}));
  return res.json();
}
// ---- Load ----
async function loadCompanies(){
  const r = await api('/api/companies');
  if(!r.success) return showErr(r.error);
  companies = r.data || [];
  const sel = document.getElementById('companySelect');
  const cur = sel.value;
  sel.innerHTML = '<option value="">-- Pilih syarikat --</option>' +
    companies.map(c => '<option value="'+esc(c.code)+'">'+esc(c.code)+' — '+esc(c.name)+'</option>').join('');
  if(cur) sel.value = cur;
  renderCompanies();
}
async function loadCompanyData(){
  if(!selectedCode){ services=[]; payments=[]; renderServices(); renderPayments(); renderSummary(); return; }
  const s = await api('/api/companies/'+selectedCode+'/services');
  const p = await api('/api/companies/'+selectedCode+'/payments');
  services = s.success ? (s.data||[]) : [];
  payments = p.success ? (p.data||[]) : [];
  renderServices(); renderPayments(); renderSummary();
}
function onCompanyChange(){
  selectedCode = document.getElementById('companySelect').value;
  const c = companies.find(x => x.code === selectedCode);
  document.getElementById('selectedInfo').textContent = c
    ? (c.name + ' • ' + (c.address||'-') + ' • ' + (c.phone||'-'))
    : 'Belum ada syarikat dipilih.';
  loadCompanyData();
}
function selectCompany(code){
  selectedCode = code;
  document.getElementById('companySelect').value = code;
  onCompanyChange();
  showTab('services');
}
// ---- Companies ----
function renderCompanies(){
  document.getElementById('page-companies').innerHTML = \`
  <div class="card">
    <h2>➕ Daftar Syarikat Baru</h2>
    <div class="row">
      <div><label>Nama Syarikat *</label><input id="c_name" placeholder="cth: Syarikat Maju Sdn Bhd"></div>
      <div><label>Jenis</label><select id="c_type">
        <option value="sdn_bhd">Sdn Bhd</option>
        <option value="sdn_bhd_normal">Sdn Bhd (Normal)</option>
        <option value="enterprise">Enterprise</option>
        <option value="coop">Koperasi</option>
        <option value="sole_prop">Milikan Tunggal</option>
      </select></div>
    </div>
    <label>Alamat</label><input id="c_address" placeholder="Lot 1, Jalan Contoh, Kota Kinabalu">
    <div class="row3">
      <div><label>Telefon</label><input id="c_phone" placeholder="088-123456"></div>
      <div><label>Email</label><input id="c_email" placeholder="info@syarikat.my"></div>
      <div><label>Kadar Cukai (%)</label><input id="c_tax" type="number" value="24" step="0.1"></div>
    </div>
    <button class="btn" onclick="createCompany()">Daftar Syarikat</button>
    <p class="muted" style="margin-top:8px">Kod unik dijana automatik.</p>
  </div>
  <div class="card">
    <h2>📋 Senarai Syarikat (\${companies.length})</h2>
    <div style="overflow-x:auto"><table>
      <tr><th>Kod</th><th>Nama</th><th>Servis</th><th>Dibayar</th><th>Belum Bayar</th><th></th></tr>
      \${companies.map(c => \`<tr>
        <td><span class="code">\${esc(c.code)}</span></td>
        <td><b>\${esc(c.name)}</b><br><span class="muted">\${esc(c.phone||'')} \${esc(c.email||'')}</span></td>
        <td>\${c.service_count||0}</td>
        <td style="color:#0b7a44;font-weight:600">\${money(c.total_paid)}</td>
        <td style="color:#b3261e;font-weight:600">\${money(c.total_unpaid)}</td>
        <td class="actions">
          <button class="btn btn-sm" onclick="selectCompany('\${esc(c.code)}')">Pilih</button>
          <button class="btn btn-sm btn-red" onclick="deleteCompany('\${esc(c.code)}')">Padam</button>
        </td>
      </tr>\`).join('') || '<tr><td colspan="6" class="muted">Tiada syarikat lagi.</td></tr>'}
    </table></div>
  </div>\`;
}
async function createCompany(){
  const body = {
    name: document.getElementById('c_name').value.trim(),
    type: document.getElementById('c_type').value,
    address: document.getElementById('c_address').value.trim(),
    phone: document.getElementById('c_phone').value.trim(),
    email: document.getElementById('c_email').value.trim(),
    tax_rate: Number(document.getElementById('c_tax').value) || 24
  };
  if(!body.name) return showErr('Nama syarikat diperlukan');
  const r = await api('/api/companies', {method:'POST', body: JSON.stringify(body)});
  if(!r.success) return showErr(r.error);
  showMsg('Syarikat didaftarkan! Kod unik: ' + r.data.code);
  await loadCompanies();
}
async function deleteCompany(code){
  if(!confirm('Padam syarikat ' + code + ' beserta semua servis & bayaran?')) return;
  const r = await api('/api/companies/'+code, {method:'DELETE'});
  if(!r.success) return showErr(r.error);
  if(selectedCode === code) selectedCode = '';
  showMsg('Syarikat dipadam.');
  await loadCompanies();
  await loadCompanyData();
}
// ---- Services ----
function renderServices(){
  const c = companies.find(x => x.code === selectedCode);
  document.getElementById('page-services').innerHTML = \`
  <div class="card">
    <h2>🧾 Tambah Perkhidmatan \${c ? '— ' + esc(c.name) : ''}</h2>
    \${!selectedCode ? '<p class="muted">Pilih syarikat dahulu di atas.</p>' : \`
    <div class="row3">
      <div><label>Nama Perkhidmatan *</label><input id="s_name" placeholder="cth: Perkhidmatan Audit"></div>
      <div><label>Caj (RM) *</label><input id="s_charge" type="number" step="0.01" placeholder="0.00"></div>
      <div><label>Jenis Bil</label><select id="s_billing">
        <option value="bulanan">Bulanan</option>
        <option value="tahunan">Tahunan</option>
      </select></div>
    </div>
    <button class="btn" onclick="createService()">Tambah Perkhidmatan</button>\`}
  </div>
  <div class="card">
    <h2>📋 Senarai Perkhidmatan (\${services.length})</h2>
    <div style="overflow-x:auto"><table>
      <tr><th>Perkhidmatan</th><th>Caj</th><th>Jenis Bil</th><th></th></tr>
      \${services.map(s => \`<tr>
        <td><b>\${esc(s.service_name)}</b></td>
        <td>\${money(s.service_charge)}</td>
        <td><span class="badge \${s.billing_type === 'tahunan' ? 'tahunan' : 'bulanan'}">\${esc(s.billing_type)}</span></td>
        <td class="actions">
          <button class="btn btn-sm btn-green" onclick="quickPayment('\${esc(s.id)}', \${Number(s.service_charge)||0}, '\${esc(s.service_name)}')">+ Bil</button>
          <button class="btn btn-sm btn-red" onclick="deleteService('\${esc(s.id)}')">Padam</button>
        </td>
      </tr>\`).join('') || '<tr><td colspan="4" class="muted">Tiada perkhidmatan lagi.</td></tr>'}
    </table></div>
  </div>\`;
}
async function createService(){
  if(!selectedCode) return showErr('Pilih syarikat dahulu');
  const body = {
    service_name: document.getElementById('s_name').value.trim(),
    service_charge: Number(document.getElementById('s_charge').value) || 0,
    billing_type: document.getElementById('s_billing').value
  };
  if(!body.service_name) return showErr('Nama perkhidmatan diperlukan');
  const r = await api('/api/companies/'+selectedCode+'/services', {method:'POST', body: JSON.stringify(body)});
  if(!r.success) return showErr(r.error);
  showMsg('Perkhidmatan ditambah.');
  await loadCompanyData(); await loadCompanies();
}
async function deleteService(id){
  if(!confirm('Padam perkhidmatan ini (beserta bil berkaitan)?')) return;
  const r = await api('/api/companies/'+selectedCode+'/services/'+id, {method:'DELETE'});
  if(!r.success) return showErr(r.error);
  showMsg('Perkhidmatan dipadam.');
  await loadCompanyData(); await loadCompanies();
}
// ---- Payments ----
function renderPayments(){
  const c = companies.find(x => x.code === selectedCode);
  document.getElementById('page-payments').innerHTML = \`
  <div class="card">
    <h2>💰 Tambah Rekod Bayaran \${c ? '— ' + esc(c.name) : ''}</h2>
    \${!selectedCode ? '<p class="muted">Pilih syarikat dahulu di atas.</p>' : \`
    <div class="row3">
      <div><label>Perkhidmatan *</label><select id="p_service">
        \${services.map(s => '<option value="'+esc(s.id)+'">'+esc(s.service_name)+' — '+money(s.service_charge)+'</option>').join('')}
      </select></div>
      <div><label>Jumlah (RM)</label><input id="p_amount" type="number" step="0.01" placeholder="0.00"></div>
      <div><label>Tarikh Akhir (Due)</label><input id="p_due" type="date"></div>
    </div>
    <div class="row">
      <div><label>Status</label><select id="p_status">
        <option value="unpaid">Belum Bayar</option>
        <option value="paid">Telah Bayar</option>
        <option value="pending">Pending</option>
      </select></div>
      <div><label>Nota</label><input id="p_notes" placeholder="cth: Bil September 2026"></div>
    </div>
    <button class="btn" onclick="createPayment()">Tambah Rekod</button>\`}
  </div>
  <div class="card">
    <h2>📋 Senarai Bayaran (\${payments.length})</h2>
    <p class="muted">Belum bayar: \${money(payments.filter(p=>p.status!=='paid').reduce((t,p)=>t+(Number(p.amount)||0),0))} • Telah bayar: \${money(payments.filter(p=>p.status==='paid').reduce((t,p)=>t+(Number(p.amount)||0),0))}</p>
    <div style="overflow-x:auto"><table>
      <tr><th>Perkhidmatan</th><th>Jumlah</th><th>Due</th><th>Tarikh Bayar</th><th>Status</th><th></th></tr>
      \${payments.map(p => \`<tr>
        <td><b>\${esc(p.service_name||'-')}</b><br><span class="muted">\${esc(p.notes||'')}</span></td>
        <td>\${money(p.amount)}</td>
        <td>\${esc(p.due_date||'-')}</td>
        <td>\${esc(p.payment_date||'-')}</td>
        <td><span class="badge \${p.status}">\${p.status === 'paid' ? 'Telah Bayar' : (p.status === 'pending' ? 'Pending' : 'Belum Bayar')}</span></td>
        <td class="actions">
          \${p.status !== 'paid'
            ? '<button class="btn btn-sm btn-green" onclick="setPaymentStatus(\\''+esc(p.id)+'\\',\\'paid\\')">Tanda Bayar</button>'
            : '<button class="btn btn-sm" onclick="setPaymentStatus(\\''+esc(p.id)+'\\',\\'unpaid\\')">Batal Bayar</button>'}
          <button class="btn btn-sm btn-red" onclick="deletePayment('\${esc(p.id)}')">Padam</button>
        </td>
      </tr>\`).join('') || '<tr><td colspan="6" class="muted">Tiada rekod bayaran lagi.</td></tr>'}
    </table></div>
  </div>\`;
}
async function createPayment(){
  if(!selectedCode) return showErr('Pilih syarikat dahulu');
  const svcId = document.getElementById('p_service').value;
  if(!svcId) return showErr('Tambah perkhidmatan dahulu');
  const amountRaw = document.getElementById('p_amount').value;
  const body = {
    service_id: svcId,
    amount: amountRaw === '' ? undefined : Number(amountRaw),
    due_date: document.getElementById('p_due').value || null,
    status: document.getElementById('p_status').value,
    notes: document.getElementById('p_notes').value.trim()
  };
  const r = await api('/api/companies/'+selectedCode+'/payments', {method:'POST', body: JSON.stringify(body)});
  if(!r.success) return showErr(r.error);
  showMsg('Rekod bayaran ditambah.');
  await loadCompanyData(); await loadCompanies();
}
async function quickPayment(serviceId, amount, name){
  const due = prompt('Tarikh akhir (YYYY-MM-DD) untuk: ' + name + ' (' + money(amount) + ')', new Date().toISOString().slice(0,10));
  if(due === null) return;
  const r = await api('/api/companies/'+selectedCode+'/payments', {method:'POST', body: JSON.stringify({
    service_id: serviceId, amount: amount, due_date: due || null, status:'unpaid', notes:'Bil untuk ' + name
  })});
  if(!r.success) return showErr(r.error);
  showMsg('Bil ditambah. Tanda bayar di tab Pembayaran.');
  await loadCompanyData(); await loadCompanies();
  showTab('payments');
}
async function setPaymentStatus(id, status){
  const r = await api('/api/companies/'+selectedCode+'/payments/'+id, {method:'PUT', body: JSON.stringify({status: status})});
  if(!r.success) return showErr(r.error);
  showMsg(status === 'paid' ? 'Ditanda sebagai telah bayar.' : 'Status dikembalikan ke belum bayar.');
  await loadCompanyData(); await loadCompanies();
}
async function deletePayment(id){
  if(!confirm('Padam rekod bayaran ini?')) return;
  const r = await api('/api/companies/'+selectedCode+'/payments/'+id, {method:'DELETE'});
  if(!r.success) return showErr(r.error);
  showMsg('Rekod bayaran dipadam.');
  await loadCompanyData(); await loadCompanies();
}
// ---- Summary ----
async function renderSummary(){
  const el = document.getElementById('page-summary');
  if(!selectedCode){
    el.innerHTML = '<div class="card"><h2>📊 Ringkasan</h2><p class="muted">Pilih syarikat untuk melihat ringkasan.</p></div>';
    return;
  }
  const r = await api('/api/companies/'+selectedCode+'/summary');
  if(!r.success){ el.innerHTML = '<div class="card"><p class="muted">Gagal memuatkan ringkasan.</p></div>'; return; }
  const d = r.data; const t = d.totals;
  el.innerHTML = \`
  <div class="card">
    <h2>📊 Ringkasan — \${esc(d.company.name)}</h2>
    <p class="muted">Kod: <span class="code">\${esc(d.company.code)}</span> • \${esc(d.company.address||'-')} • \${esc(d.company.phone||'-')}</p>
    <div class="stats" style="margin-top:14px">
      <div class="stat"><div class="lbl">Jumlah Perkhidmatan</div><div class="val">\${t.services}</div></div>
      <div class="stat"><div class="lbl">Bulanan / Tahunan</div><div class="val">\${t.services_bulanan} / \${t.services_tahunan}</div></div>
      <div class="stat"><div class="lbl">Jumlah Bil</div><div class="val">\${t.payments}</div></div>
      <div class="stat"><div class="lbl">Telah Bayar</div><div class="val" style="color:#0b7a44">\${money(t.total_paid)}</div><div class="lbl">\${t.payments_paid} bil</div></div>
      <div class="stat" style="border-left-color:#d93025"><div class="lbl">Belum Bayar</div><div class="val" style="color:#b3261e">\${money(t.total_unpaid)}</div><div class="lbl">\${t.payments_unpaid} bil</div></div>
      <div class="stat" style="border-left-color:#6b21a8"><div class="lbl">Caj Berulang</div><div class="val" style="font-size:15px">\${money(t.monthly_recurring)}/bln</div><div class="lbl">\${money(t.annual_recurring)}/thn</div></div>
    </div>
  </div>\`;
}
// ---- Init ----
loadCompanies().then(() => loadCompanyData());

</script>
</body>
</html>`;
}
