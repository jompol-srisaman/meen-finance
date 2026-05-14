// cashflow.js

document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([loadFreedomMeter(), loadIncomeStatement(), loadBalanceSheet()]);
});

async function loadFreedomMeter() {
  try {
    const data = await API.getFreedomMeter();
    const ratio = data.ratio || 0;
    const clamped = Math.min(ratio, 100);

    document.getElementById('freedom-bar').style.width = clamped + '%';
    document.getElementById('freedom-pct-big').textContent = ratio.toFixed(1) + '%';
    document.getElementById('passive-income').textContent = formatMoney(data.passiveIncome);
    document.getElementById('total-expenses-meter').textContent = formatMoney(data.totalExpenses);

    const banner = document.getElementById('status-banner');
    const statusText = document.getElementById('status-text');
    const statusSub = document.getElementById('status-sub');

    if (data.status === 'fast_track') {
      banner.className = 'rounded-2xl p-4 text-center bg-green-100';
      statusText.className = 'text-xl font-bold text-green-700';
      statusText.textContent = 'FAST TRACK 🚀';
      statusSub.className = 'text-sm mt-1 text-green-600';
      statusSub.textContent = currentLang === 'th'
        ? 'คุณบรรลุอิสรภาพทางการเงินแล้ว! 🎉'
        : 'You have achieved financial freedom! 🎉';
    } else {
      banner.className = 'rounded-2xl p-4 text-center bg-red-50';
      statusText.className = 'text-xl font-bold text-red-600';
      statusText.textContent = 'RAT RACE 🐀';
      const needed = (data.totalExpenses - data.passiveIncome);
      statusSub.className = 'text-sm mt-1 text-red-500';
      statusSub.textContent = currentLang === 'th'
        ? `ต้องการ passive income เพิ่ม ${formatMoney(needed)} / เดือน`
        : `Need ${formatMoney(needed)} more passive income / month`;
    }
  } catch (e) {
    console.error(e);
  }
}

async function loadIncomeStatement() {
  try {
    const stmt = await API.getIncomeStatement();
    const income = stmt.income;
    const expenses = stmt.expenses;

    // Income rows
    const incomeRows = [
      { label: currentLang === 'th' ? 'เงินเดือน' : 'Salary', value: income.salary },
      { label: currentLang === 'th' ? 'Passive Income' : 'Passive Income', value: income.passive },
      { label: currentLang === 'th' ? 'Portfolio' : 'Portfolio', value: income.portfolio },
    ];
    document.getElementById('income-rows').innerHTML = incomeRows.map(r => `
      <div class="row-item">
        <span class="text-gray-600 truncate text-xs">${r.label}</span>
        <span class="text-green-600 text-xs font-medium ml-1">${formatMoney(r.value)}</span>
      </div>
    `).join('');
    document.getElementById('total-income').textContent = formatMoney(income.total);

    // Expense rows — show by type
    const expenseTypes = Object.entries(expenses).filter(([k]) => k !== 'total');
    document.getElementById('expense-rows').innerHTML = expenseTypes.map(([k, v]) => `
      <div class="row-item">
        <span class="text-gray-600 truncate text-xs">${expenseLabelTh(k)}</span>
        <span class="text-red-500 text-xs font-medium ml-1">${formatMoney(v)}</span>
      </div>
    `).join('') || '<p class="text-xs text-gray-400">No expenses</p>';
    document.getElementById('total-expenses').textContent = formatMoney(expenses.total);

    // Monthly cashflow
    const cf = stmt.cashflow || 0;
    const cfEl = document.getElementById('monthly-cf');
    cfEl.textContent = (cf >= 0 ? '+' : '') + formatMoney(cf);
    cfEl.className = 'text-xl font-bold ' + (cf >= 0 ? 'positive' : 'negative');

    // Donut chart
    const ctx = document.getElementById('incomeDonut').getContext('2d');
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Salary', 'Passive', 'Portfolio'],
        datasets: [{
          data: [income.salary, income.passive, income.portfolio],
          backgroundColor: ['#3b82f6', '#22c55e', '#a855f7'],
          borderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 11 } } }
        },
        cutout: '65%'
      }
    });
  } catch (e) {
    console.error(e);
  }
}

async function loadBalanceSheet() {
  try {
    const data = await API.getBalanceSheet();

    // Assets by category
    const assetsByCat = {};
    (data.assets || []).forEach(a => {
      assetsByCat[a.category] = (assetsByCat[a.category] || 0) + (parseFloat(a.value) || 0);
    });
    document.getElementById('asset-rows').innerHTML = Object.entries(assetsByCat).map(([k, v]) => `
      <div class="row-item">
        <span class="text-gray-600 truncate text-xs">${assetLabelTh(k)}</span>
        <span class="text-green-600 text-xs font-medium">${formatMoney(v)}</span>
      </div>
    `).join('') || '<p class="text-xs text-gray-400">No assets</p>';
    document.getElementById('bs-total-assets').textContent = formatMoney(data.totalAssets);

    // Liabilities by category
    const liabByCat = {};
    (data.liabilities || []).forEach(l => {
      liabByCat[l.category] = (liabByCat[l.category] || 0) + (parseFloat(l.balance) || 0);
    });
    document.getElementById('liability-rows').innerHTML = Object.entries(liabByCat).map(([k, v]) => `
      <div class="row-item">
        <span class="text-gray-600 truncate text-xs">${liabilityLabelTh(k)}</span>
        <span class="text-red-500 text-xs font-medium">${formatMoney(v)}</span>
      </div>
    `).join('') || '<p class="text-xs text-gray-400">No liabilities</p>';
    document.getElementById('bs-total-liabilities').textContent = formatMoney(data.totalLiabilities);

    const nw = data.netWorth || 0;
    const nwEl = document.getElementById('net-worth');
    nwEl.textContent = formatMoney(nw);
    nwEl.className = 'text-xl font-bold ' + (nw >= 0 ? 'positive' : 'negative');
  } catch (e) {
    console.error(e);
  }
}

function expenseLabelTh(key) {
  const map = { tax: 'ภาษี', mortgage: 'ผ่อนบ้าน', car_payment: 'ผ่อนรถ', credit_card: 'บัตรเครดิต', food: 'อาหาร', transport: 'เดินทาง', other: 'อื่นๆ' };
  return currentLang === 'th' ? (map[key] || key) : key;
}

function assetLabelTh(key) {
  const map = { savings: 'เงินออม', stocks: 'หุ้น', real_estate: 'อสังหาฯ', business: 'ธุรกิจ', other: 'อื่นๆ' };
  return currentLang === 'th' ? (map[key] || key) : key;
}

function liabilityLabelTh(key) {
  const map = { mortgage: 'สินเชื่อบ้าน', car_loan: 'สินเชื่อรถ', credit_card: 'บัตรเครดิต', student_loan: 'สินเชื่อการศึกษา', other: 'อื่นๆ' };
  return currentLang === 'th' ? (map[key] || key) : key;
}
