// transactions.js

let currentType = 'income';
let currentWalletFilter = 'all';
let currentMonth = new Date().getMonth() + 1;
let currentYear = new Date().getFullYear();
let currentTab = 'list';
let cachedAccounts = [];
let searchQuery = '';
let _editRow = null;
let _allTxs = [];
let _searchTimer = null;

const INCOME_CATS = ['เงินเดือน','Freelance/งานพิเศษ','รายได้เช่า','ปันผล/กองทุน','ขายของ/บริการ','รายได้อื่นๆ'];
const EXPENSE_CATS = ['อาหาร/เครื่องดื่ม','เดินทาง/น้ำมัน','ที่พัก/บ้าน','สุขภาพ','บันเทิง','ช้อปปิ้ง','ค่าประกัน','ออม/ลงทุน','หนี้/ผ่อน','อื่นๆ'];

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('tx-date').value = new Date().toISOString().split('T')[0];
  updateMonthLabel();
  loadTransactions();
  setWalletFilter('all');
});

function updateMonthLabel() {
  const months = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  document.getElementById('month-label').textContent = `${months[currentMonth - 1]} ${currentYear + 543}`;
}

function changeMonth(delta) {
  currentMonth += delta;
  if (currentMonth > 12) { currentMonth = 1; currentYear++; }
  if (currentMonth < 1) { currentMonth = 12; currentYear--; }
  updateMonthLabel();
  loadTransactions();
}

function setTab(tab) {
  currentTab = tab;
  const isListTab = tab === 'list';
  document.getElementById('view-list').classList.toggle('hidden', !isListTab);
  document.getElementById('tx-list').classList.toggle('hidden', !isListTab);
  document.getElementById('view-budget').classList.toggle('hidden', isListTab);

  const listBtn = document.getElementById('tab-txlist');
  const budgetBtn = document.getElementById('tab-budget');
  if (isListTab) {
    listBtn.style.cssText = 'background:var(--card);color:var(--primary)';
    budgetBtn.style.cssText = 'color:var(--text-muted)';
  } else {
    budgetBtn.style.cssText = 'background:var(--card);color:var(--primary)';
    listBtn.style.cssText = 'color:var(--text-muted)';
    loadBudgetActual();
  }
}

function setWalletFilter(w) {
  currentWalletFilter = w;
  ['all','personal','family'].forEach(id => {
    const btn = document.getElementById('wf-' + id);
    if (!btn) return;
    if (id === w) {
      btn.style.cssText = 'background:var(--primary);color:white;border-color:var(--primary)';
    } else {
      btn.style.cssText = 'background:transparent;color:var(--text-muted);border-color:var(--divider)';
    }
  });
  loadTransactions();
}

function onSearchInput(val) {
  clearTimeout(_searchTimer);
  _searchTimer = setTimeout(() => { searchQuery = val.trim().toLowerCase(); renderTxList(); }, 280);
}

async function loadTransactions() {
  const el = document.getElementById('tx-list');
  el.innerHTML = '<div class="flex justify-center p-8"><div class="animate-spin rounded-full h-8 w-8 border-b-2" style="border-color:var(--primary)"></div></div>';
  try {
    _allTxs = await API.getTransactions(currentMonth, currentYear);
    renderTxList();
  } catch (e) {
    el.innerHTML = `<div class="text-center py-8 text-red-400"><i class="fas fa-exclamation-circle text-3xl mb-2 block"></i><p>โหลดข้อมูลไม่ได้ กรุณาลองใหม่</p></div>`;
  }
}

function renderTxList() {
  const el = document.getElementById('tx-list');
  let txs = _allTxs;

  if (currentWalletFilter !== 'all') txs = txs.filter(t => (t.wallet || 'personal') === currentWalletFilter);
  if (searchQuery) txs = txs.filter(t =>
    (t.description || '').toLowerCase().includes(searchQuery) ||
    (t.category || '').toLowerCase().includes(searchQuery)
  );

  let incomeSum = 0, expenseSum = 0;
  txs.forEach(t => {
    const amt = parseFloat(t.amount) || 0;
    if (t.type === 'income') incomeSum += amt; else expenseSum += amt;
  });
  document.getElementById('sum-income').textContent = formatMoney(incomeSum);
  document.getElementById('sum-expense').textContent = formatMoney(expenseSum);
  const net = incomeSum - expenseSum;
  const netEl = document.getElementById('sum-net');
  netEl.textContent = formatMoney(net);
  netEl.className = 'font-bold text-sm mt-1 ' + (net >= 0 ? 'text-blue-600' : 'text-red-500');

  if (!txs.length) {
    el.innerHTML = `<div class="text-center py-12" style="color:var(--text-sub)"><i class="fas fa-receipt text-4xl mb-3 block"></i><p>${searchQuery ? 'ไม่พบรายการที่ค้นหา' : 'ยังไม่มีรายการในเดือนนี้'}</p></div>`;
    return;
  }

  const grouped = {};
  txs.forEach(t => { const d = t.date || 'unknown'; if (!grouped[d]) grouped[d] = []; grouped[d].push(t); });
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  el.innerHTML = sortedDates.map(date => `
    <div class="mb-3">
      <p class="text-xs font-medium mb-1 px-1" style="color:var(--text-sub)">${formatDate(date)}</p>
      <div class="app-card rounded-xl shadow-sm border overflow-hidden">
        ${grouped[date].map(tx => `
          <div class="flex items-center justify-between px-4 py-3 border-b last:border-0" style="border-color:var(--divider)">
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <div class="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${tx.type === 'income' ? 'bg-green-100' : 'bg-red-100'}">
                <i class="fas ${tx.type === 'income' ? 'fa-arrow-down text-green-500' : 'fa-arrow-up text-red-500'} text-sm"></i>
              </div>
              <div class="min-w-0">
                <p class="text-sm font-medium truncate" style="color:var(--text)">${tx.description || tx.category}</p>
                <p class="text-xs" style="color:var(--text-muted)">${tx.category} · ${walletLabel(tx.wallet)}</p>
              </div>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0 ml-2">
              <span class="font-semibold text-sm ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'}">${tx.type === 'income' ? '+' : '-'}${formatMoney(tx.amount)}</span>
              <button onclick='openEditModal(${JSON.stringify(tx)})' class="w-7 h-7 rounded-lg flex items-center justify-center" style="background:var(--divider);color:var(--text-sub)"><i class="fas fa-pen text-xs"></i></button>
              <button onclick="confirmDeleteTx(${tx._row})" class="w-7 h-7 rounded-lg flex items-center justify-center bg-red-50 text-red-400"><i class="fas fa-trash text-xs"></i></button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function walletLabel(w) {
  return w === 'family' ? '👨‍👩‍👧 ครอบครัว' : '👤 ส่วนตัว';
}

function formatDate(dateStr) {
  if (!dateStr || dateStr === 'unknown') return 'ไม่ระบุวันที่';
  const d = new Date(dateStr);
  return d.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short', year: '2-digit' });
}

async function openEditModal(tx) {
  _editRow = tx._row;
  currentType = tx.type || 'income';
  setType(currentType);
  document.getElementById('tx-amount').value = tx.amount || '';
  document.getElementById('tx-desc').value = tx.description || '';
  document.getElementById('tx-date').value = tx.date || new Date().toISOString().split('T')[0];
  document.getElementById('tx-wallet').value = tx.wallet || 'personal';

  // Update category options then set value
  updateCategories(currentType);
  const catSel = document.getElementById('tx-category');
  catSel.value = tx.category || '';

  const accSel = document.getElementById('tx-account');
  accSel.innerHTML = '<option value="">กำลังโหลดบัญชี...</option>';
  accSel.disabled = true;
  document.querySelector('#modal .modal-header h2').textContent = 'แก้ไขรายการ';
  document.getElementById('modal').classList.remove('hidden');

  try { cachedAccounts = await API.getAccounts(); } catch(e) { cachedAccounts = []; }
  accSel.disabled = false;
  accSel.innerHTML = '<option value="">-- ไม่ระบุบัญชี --</option>' +
    cachedAccounts.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
  accSel.value = tx.account_id || '';
}

async function confirmDeleteTx(row) {
  if (!confirm('ลบรายการนี้?')) return;
  try {
    await API.deleteTransaction({ _row: row });
    _allTxs = _allTxs.filter(t => t._row !== row);
    renderTxList();
  } catch(e) { alert('ลบไม่สำเร็จ'); }
}

async function openModal() {
  _editRow = null;
  currentType = 'income';
  setType('income');
  document.getElementById('tx-amount').value = '';
  document.getElementById('tx-desc').value = '';
  document.getElementById('tx-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('tx-wallet').value = 'personal';
  document.querySelector('#modal .modal-header h2').textContent = 'เพิ่มรายการ';

  const accSel = document.getElementById('tx-account');
  accSel.innerHTML = '<option value="">กำลังโหลดบัญชี...</option>';
  accSel.disabled = true;

  document.getElementById('modal').classList.remove('hidden');
  setTimeout(() => document.getElementById('tx-amount').focus(), 150);

  const ACC_TYPE_EMOJI = { bank: '🏦', savings: '💰', cash: '💵', credit_card: '💳' };
  try {
    cachedAccounts = await API.getAccounts();
  } catch (e) {
    cachedAccounts = [];
  }
  accSel.disabled = false;
  if (!cachedAccounts.length) {
    accSel.innerHTML = '<option value="">-- ยังไม่มีบัญชี (เพิ่มใน ตั้งค่า) --</option>';
  } else {
    accSel.innerHTML = '<option value="">-- ไม่ระบุบัญชี --</option>' +
      cachedAccounts.map(a => `<option value="${a.id}">${ACC_TYPE_EMOJI[a.type] || '🏦'} ${a.name}</option>`).join('');
  }
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
}

function setType(type) {
  currentType = type;
  const incBtn = document.getElementById('btn-income');
  const expBtn = document.getElementById('btn-expense');
  if (type === 'income') {
    incBtn.className = 'flex-1 py-2 rounded-xl font-medium bg-green-500 text-white text-sm';
    incBtn.removeAttribute('style');
    expBtn.className = 'flex-1 py-2 rounded-xl font-medium text-sm';
    expBtn.style.cssText = 'background:var(--bg);color:var(--text-muted)';
  } else {
    expBtn.className = 'flex-1 py-2 rounded-xl font-medium bg-red-500 text-white text-sm';
    expBtn.removeAttribute('style');
    incBtn.className = 'flex-1 py-2 rounded-xl font-medium text-sm';
    incBtn.style.cssText = 'background:var(--bg);color:var(--text-muted)';
  }
  updateCategories(type);
}

function updateCategories(type) {
  const select = document.getElementById('tx-category');
  const opts = type === 'income' ? INCOME_CATS : EXPENSE_CATS;
  select.innerHTML = opts.map(o => `<option value="${o}">${o}</option>`).join('');
}

async function loadBudgetActual() {
  const el = document.getElementById('budget-list');
  el.innerHTML = '<div class="flex justify-center p-8"><div class="animate-spin rounded-full h-8 w-8 border-b-2" style="border-color:var(--primary)"></div></div>';
  try {
    const resp = await API.getBudgetActual(currentMonth, currentYear);
    const data = resp.items || resp;
    if (!data || !data.length) {
      el.innerHTML = '<div class="app-card rounded-2xl p-6 text-center border"><p style="color:var(--text-sub)">ยังไม่มีหมวดหมู่ค่าใช้จ่าย</p><a href="settings.html" class="text-sm mt-2 block" style="color:var(--primary)">ตั้งค่าหมวดหมู่ →</a></div>';
      return;
    }
    el.innerHTML = `
      <div class="app-card rounded-2xl shadow-sm border overflow-hidden">
        <div class="flex items-center px-4 py-2 text-xs font-semibold" style="background:var(--divider);color:var(--text-sub)">
          <span class="flex-1">หมวดหมู่</span>
          <span class="w-20 text-right">งบ</span>
          <span class="w-20 text-right">จริง</span>
          <span class="w-20 text-right">คงเหลือ</span>
        </div>
        ${data.map(row => {
          const over = row.variance < 0;
          const pct = row.budget > 0 ? Math.min(row.actual / row.budget * 100, 100) : 0;
          return `
          <div class="px-4 py-3 border-b last:border-0" style="border-color:var(--divider)">
            <div class="flex items-center mb-1">
              <span class="flex-1 text-sm font-medium" style="color:var(--text)">${row.name}</span>
              <span class="w-20 text-right text-xs" style="color:var(--text-sub)">${formatMoney(row.budget)}</span>
              <span class="w-20 text-right text-sm font-medium ${over ? 'text-red-500' : ''}">${formatMoney(row.actual)}</span>
              <span class="w-20 text-right text-sm font-semibold ${over ? 'text-red-500' : 'text-green-600'}">${over ? '-' : '+'}${formatMoney(Math.abs(row.variance))}</span>
            </div>
            <div class="w-full rounded-full h-1.5 mt-1" style="background:var(--divider)">
              <div class="h-1.5 rounded-full transition-all" style="width:${pct}%;background:${over ? '#ef4444' : 'var(--primary)'}"></div>
            </div>
          </div>`;
        }).join('')}
      </div>`;
  } catch (e) {
    el.innerHTML = '<div class="text-center py-8 text-red-400">โหลดข้อมูลไม่ได้</div>';
  }
}

async function saveTransaction() {
  const amount = parseFloat(document.getElementById('tx-amount').value);
  if (!amount || amount <= 0) { alert('กรุณากรอกจำนวนเงิน'); return; }

  const btn = document.getElementById('save-btn');
  btn.textContent = 'กำลังบันทึก...';
  btn.disabled = true;

  const data = {
    date: document.getElementById('tx-date').value,
    type: currentType,
    category: document.getElementById('tx-category').value,
    amount,
    description: document.getElementById('tx-desc').value,
    wallet: document.getElementById('tx-wallet').value,
    account_id: document.getElementById('tx-account').value || '',
  };

  try {
    if (_editRow !== null) {
      await API.updateTransaction({ ...data, _row: _editRow });
    } else {
      await API.addTransaction(data);
    }
    closeModal();
    loadTransactions();
  } catch (e) {
    alert('บันทึกไม่สำเร็จ กรุณาลองใหม่');
  } finally {
    btn.textContent = 'บันทึก';
    btn.disabled = false;
  }
}
