// transactions.js

let currentType = 'expense';
let currentMonth = new Date().getMonth() + 1;
let currentYear = new Date().getFullYear();

document.addEventListener('DOMContentLoaded', () => {
  // Set today's date
  document.getElementById('tx-date').value = new Date().toISOString().split('T')[0];
  updateMonthLabel();
  loadTransactions();
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

async function loadTransactions() {
  const el = document.getElementById('tx-list');
  el.innerHTML = '<div class="flex justify-center p-8"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>';
  try {
    const txs = await API.getTransactions(currentMonth, currentYear);

    let incomeSum = 0, expenseSum = 0;
    txs.forEach(t => {
      const amt = parseFloat(t.amount) || 0;
      if (t.type === 'income') incomeSum += amt;
      else expenseSum += amt;
    });

    document.getElementById('sum-income').textContent = formatMoney(incomeSum);
    document.getElementById('sum-expense').textContent = formatMoney(expenseSum);
    const net = incomeSum - expenseSum;
    const netEl = document.getElementById('sum-net');
    netEl.textContent = formatMoney(net);
    netEl.className = 'font-bold text-sm mt-1 ' + (net >= 0 ? 'text-blue-600' : 'text-red-500');

    if (!txs.length) {
      el.innerHTML = `<div class="text-center py-12 text-gray-400"><i class="fas fa-receipt text-4xl mb-3"></i><p>ยังไม่มีรายการในเดือนนี้</p></div>`;
      return;
    }

    // Group by date
    const grouped = {};
    txs.forEach(t => {
      const d = t.date || 'unknown';
      if (!grouped[d]) grouped[d] = [];
      grouped[d].push(t);
    });

    const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
    el.innerHTML = sortedDates.map(date => `
      <div class="mb-3">
        <p class="text-xs text-gray-400 font-medium mb-1">${formatDate(date)}</p>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          ${grouped[date].map(tx => `
            <div class="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-full flex items-center justify-center ${tx.type === 'income' ? 'bg-green-100' : 'bg-red-100'}">
                  <i class="fas ${tx.type === 'income' ? 'fa-arrow-down text-green-500' : 'fa-arrow-up text-red-500'} text-sm"></i>
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-700">${tx.description || tx.category}</p>
                  <p class="text-xs text-gray-400">${tx.category}</p>
                </div>
              </div>
              <span class="font-semibold text-sm ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'}">
                ${tx.type === 'income' ? '+' : '-'}${formatMoney(tx.amount)}
              </span>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  } catch (e) {
    el.innerHTML = `<div class="text-center py-8 text-red-400"><i class="fas fa-exclamation-circle text-3xl mb-2"></i><p>โหลดข้อมูลไม่ได้ กรุณาลองใหม่</p></div>`;
  }
}

function formatDate(dateStr) {
  if (!dateStr || dateStr === 'unknown') return 'ไม่ระบุวันที่';
  const d = new Date(dateStr);
  return d.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short', year: '2-digit' });
}

function openModal() {
  document.getElementById('modal').classList.remove('hidden');
  document.getElementById('tx-amount').focus();
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
}

function setType(type) {
  currentType = type;
  if (type === 'income') {
    document.getElementById('btn-income').className = 'flex-1 py-2 rounded-xl font-medium bg-green-500 text-white text-sm';
    document.getElementById('btn-expense').className = 'flex-1 py-2 rounded-xl font-medium bg-gray-200 text-gray-600 text-sm';
  } else {
    document.getElementById('btn-expense').className = 'flex-1 py-2 rounded-xl font-medium bg-red-500 text-white text-sm';
    document.getElementById('btn-income').className = 'flex-1 py-2 rounded-xl font-medium bg-gray-200 text-gray-600 text-sm';
  }
}

async function saveTransaction() {
  const amount = parseFloat(document.getElementById('tx-amount').value);
  if (!amount || amount <= 0) {
    alert('กรุณากรอกจำนวนเงิน');
    return;
  }

  const btn = document.getElementById('save-btn');
  btn.textContent = 'กำลังบันทึก...';
  btn.disabled = true;

  try {
    await API.addTransaction({
      date: document.getElementById('tx-date').value,
      type: currentType,
      category: document.getElementById('tx-category').value,
      amount: amount,
      description: document.getElementById('tx-desc').value,
    });
    closeModal();
    // Reset form
    document.getElementById('tx-amount').value = '';
    document.getElementById('tx-desc').value = '';
    loadTransactions();
  } catch (e) {
    alert('บันทึกไม่สำเร็จ กรุณาลองใหม่');
  } finally {
    btn.textContent = 'บันทึก';
    btn.disabled = false;
  }
}
