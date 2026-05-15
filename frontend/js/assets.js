// assets.js

document.addEventListener('DOMContentLoaded', () => {
  loadAll();
  if (location.hash === '#income') switchTab('income');
});

async function loadAll() {
  await Promise.all([loadAssetsPanel(), loadLiabilitiesPanel(), loadIncomePanel(), loadHeader()]);
}

async function loadHeader() {
  try {
    const data = await API.getBalanceSheet();
    document.getElementById('hdr-assets').textContent = formatMoney(data.totalAssets);
    document.getElementById('hdr-liabilities').textContent = formatMoney(data.totalLiabilities);
    const nw = data.netWorth;
    document.getElementById('hdr-networth').textContent = formatMoney(nw);
    document.getElementById('hdr-networth').className = 'font-bold text-sm mt-0.5 ' + (nw >= 0 ? 'text-green-700' : 'text-red-600');
  } catch (e) {}
}

async function loadAssetsPanel() {
  const el = document.getElementById('assets-list');
  try {
    const items = await API.getAssets();
    if (!items.length) {
      el.innerHTML = emptyState('ยังไม่มีทรัพย์สิน', 'fa-building-columns');
      return;
    }
    el.innerHTML = items.map(a => `
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3">
        <div class="flex justify-between items-start">
          <div>
            <p class="font-semibold text-gray-700">${a.name}</p>
            <span class="text-xs bg-green-100 text-green-600 rounded-full px-2 py-0.5 mt-1 inline-block">${assetCatLabel(a.category)}</span>
          </div>
          <div class="text-right">
            <p class="font-bold text-green-600">${formatMoney(a.value)}</p>
            ${parseFloat(a.monthly_cashflow) > 0 ? `<p class="text-xs text-green-500 mt-0.5">+${formatMoney(a.monthly_cashflow)}/เดือน</p>` : ''}
          </div>
        </div>
        <div class="flex gap-2 mt-3">
          <button onclick="deleteAsset('${a.id}')" class="flex-1 bg-red-50 text-red-500 rounded-lg py-1.5 text-xs font-medium">ลบ</button>
        </div>
      </div>
    `).join('');
  } catch (e) {
    el.innerHTML = `<p class="text-red-400 text-center py-4">โหลดไม่ได้</p>`;
  }
}

async function loadLiabilitiesPanel() {
  const el = document.getElementById('liabilities-list');
  try {
    const items = await API.getLiabilities();
    if (!items.length) {
      el.innerHTML = emptyState('ยังไม่มีหนี้สิน 🎉', 'fa-check-circle');
      return;
    }
    el.innerHTML = items.map(l => `
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3">
        <div class="flex justify-between items-start">
          <div>
            <p class="font-semibold text-gray-700">${l.name}</p>
            <span class="text-xs bg-red-100 text-red-500 rounded-full px-2 py-0.5 mt-1 inline-block">${liabCatLabel(l.category)}</span>
          </div>
          <div class="text-right">
            <p class="font-bold text-red-500">${formatMoney(l.balance)}</p>
            <p class="text-xs text-red-400 mt-0.5">ผ่อน ${formatMoney(l.monthly_payment)}/เดือน</p>
          </div>
        </div>
        ${parseFloat(l.interest_rate) > 0 ? `<p class="text-xs text-gray-400 mt-2">ดอกเบี้ย ${l.interest_rate}% ต่อปี</p>` : ''}
        <div class="flex gap-2 mt-3">
          <button onclick="deleteLiability('${l.id}')" class="flex-1 bg-red-50 text-red-500 rounded-lg py-1.5 text-xs font-medium">ลบ</button>
        </div>
      </div>
    `).join('');
  } catch (e) {
    el.innerHTML = `<p class="text-red-400 text-center py-4">โหลดไม่ได้</p>`;
  }
}

async function loadIncomePanel() {
  const el = document.getElementById('income-list');
  try {
    const items = await API.getIncomeSources();
    if (!items.length) {
      el.innerHTML = emptyState('ยังไม่มีรายได้ประจำ', 'fa-money-bill-wave');
      return;
    }
    el.innerHTML = items.map(s => `
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3">
        <div class="flex justify-between items-center">
          <div>
            <p class="font-semibold text-gray-700">${s.name}</p>
            <span class="text-xs rounded-full px-2 py-0.5 mt-1 inline-block ${incomeTypeBadge(s.type)}">${incomeTypeLabel(s.type)}</span>
          </div>
          <p class="font-bold text-blue-600">${formatMoney(s.monthly_amount)}<span class="text-xs text-gray-400 font-normal">/เดือน</span></p>
        </div>
      </div>
    `).join('');
  } catch (e) {
    el.innerHTML = `<p class="text-red-400 text-center py-4">โหลดไม่ได้</p>`;
  }
}

function switchTab(tab) {
  ['assets', 'liabilities', 'income'].forEach(t => {
    document.getElementById('tab-content-' + t).classList.add('hidden');
    document.getElementById('tab-' + t).className = 'flex-1 py-3 text-sm font-medium text-gray-400';
  });
  document.getElementById('tab-content-' + tab).classList.remove('hidden');
  const colors = { assets: 'text-green-600 border-b-2 border-green-500', liabilities: 'text-red-500 border-b-2 border-red-500', income: 'text-blue-600 border-b-2 border-blue-500' };
  document.getElementById('tab-' + tab).className = 'flex-1 py-3 text-sm font-medium ' + colors[tab];
}

function openAssetModal() { document.getElementById('asset-modal').classList.remove('hidden'); }
function openLiabilityModal() { document.getElementById('liability-modal').classList.remove('hidden'); }
function openIncomeModal() { document.getElementById('income-modal').classList.remove('hidden'); }
function closeModals() {
  ['asset-modal', 'liability-modal', 'income-modal'].forEach(id => document.getElementById(id).classList.add('hidden'));
}

async function saveAsset() {
  const name = document.getElementById('a-name').value.trim();
  const value = parseFloat(document.getElementById('a-value').value);
  if (!name || !value) { alert('กรุณากรอกข้อมูลให้ครบ'); return; }
  try {
    await API.addAsset({ name, category: document.getElementById('a-category').value, value, monthly_cashflow: document.getElementById('a-cashflow').value || 0 });
    closeModals();
    loadAssetsPanel();
    loadHeader();
  } catch (e) { alert('บันทึกไม่สำเร็จ กรุณาลองใหม่'); }
}

async function saveLiability() {
  const name = document.getElementById('l-name').value.trim();
  const balance = parseFloat(document.getElementById('l-balance').value);
  if (!name || !balance) { alert('กรุณากรอกข้อมูลให้ครบ'); return; }
  try {
    await API.addLiability({ name, category: document.getElementById('l-category').value, balance, monthly_payment: document.getElementById('l-payment').value || 0, interest_rate: document.getElementById('l-rate').value || 0 });
    closeModals();
    loadLiabilitiesPanel();
    loadHeader();
  } catch (e) { alert('บันทึกไม่สำเร็จ กรุณาลองใหม่'); }
}

async function saveIncomeSource() {
  const name = document.getElementById('i-name').value.trim();
  const amount = parseFloat(document.getElementById('i-amount').value);
  if (!name || !amount) { alert('กรุณากรอกข้อมูลให้ครบ'); return; }
  try {
    await API.addIncomeSource({ name, type: document.getElementById('i-type').value, monthly_amount: amount });
    closeModals();
    loadIncomePanel();
  } catch (e) { alert('บันทึกไม่สำเร็จ กรุณาลองใหม่'); }
}

async function deleteAsset(id) {
  if (!confirm('ลบทรัพย์สินนี้?')) return;
  try {
    await API.deleteAsset(id);
    loadAssetsPanel();
    loadHeader();
  } catch (e) { alert('ลบไม่สำเร็จ กรุณาลองใหม่'); }
}

async function deleteLiability(id) {
  if (!confirm('ลบหนี้สินนี้?')) return;
  try {
    await API.deleteLiability(id);
    loadLiabilitiesPanel();
    loadHeader();
  } catch (e) { alert('ลบไม่สำเร็จ กรุณาลองใหม่'); }
}

function emptyState(msg, icon) {
  return `<div class="text-center py-12 text-gray-400"><i class="fas ${icon} text-4xl mb-3"></i><p>${msg}</p></div>`;
}

function assetCatLabel(k) {
  return { savings: 'เงินออม', stocks: 'หุ้น/กองทุน', real_estate: 'อสังหาฯ', business: 'ธุรกิจ', other: 'อื่นๆ' }[k] || k;
}
function liabCatLabel(k) {
  return { mortgage: 'สินเชื่อบ้าน', car_loan: 'สินเชื่อรถ', credit_card: 'บัตรเครดิต', student_loan: 'สินเชื่อการศึกษา', other: 'อื่นๆ' }[k] || k;
}
function incomeTypeLabel(k) {
  return { salary: 'เงินเดือน', passive: 'Passive', portfolio: 'Portfolio' }[k] || k;
}
function incomeTypeBadge(k) {
  return { salary: 'bg-blue-100 text-blue-600', passive: 'bg-green-100 text-green-600', portfolio: 'bg-purple-100 text-purple-600' }[k] || 'bg-gray-100 text-gray-600';
}
