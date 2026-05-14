// dashboard.js

document.addEventListener('DOMContentLoaded', async () => {
  // Greeting
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'อรุณสวัสดิ์ ☀️' : hour < 18 ? 'สวัสดีตอนบ่าย 🌤' : 'สวัสดีตอนเย็น 🌙';
  document.getElementById('greeting').textContent = greet;

  // Apply language labels
  document.getElementById('lbl-networth').textContent = currentLang === 'th' ? 'มูลค่าสุทธิ' : 'Net Worth';
  document.getElementById('lbl-assets').textContent = currentLang === 'th' ? 'ทรัพย์สิน' : 'Assets';
  document.getElementById('lbl-liabilities').textContent = currentLang === 'th' ? 'หนี้สิน' : 'Liabilities';
  document.getElementById('lbl-cashflow').textContent = currentLang === 'th' ? 'เงินสดรายเดือน' : 'Monthly Flow';
  document.getElementById('lbl-freedom').textContent = currentLang === 'th' ? 'วัดอิสรภาพ' : 'Freedom Meter';
  document.getElementById('lbl-monthly').textContent = currentLang === 'th' ? 'รายรับ vs รายจ่ายเดือนนี้' : 'Income vs Expenses This Month';

  await Promise.all([loadBalanceSheet(), loadFreedomMeter(), loadIncomeChart(), loadRecentTransactions()]);
});

async function loadBalanceSheet() {
  try {
    const data = await API.getBalanceSheet();
    const nw = data.netWorth || 0;
    document.getElementById('net-worth').textContent = formatMoney(nw);
    document.getElementById('net-worth').className = 'text-3xl font-bold mt-1 ' + (nw >= 0 ? 'text-green-600' : 'text-red-500');
    document.getElementById('total-assets').textContent = formatMoney(data.totalAssets);
    document.getElementById('total-liabilities').textContent = formatMoney(data.totalLiabilities);
  } catch (e) {
    document.getElementById('net-worth').textContent = 'Error';
  }
}

async function loadFreedomMeter() {
  try {
    const data = await API.getFreedomMeter();
    const ratio = Math.min(data.ratio || 0, 100);

    document.getElementById('freedom-bar').style.width = ratio + '%';
    document.getElementById('freedom-pct').textContent = (data.ratio || 0).toFixed(1) + '%';

    const badge = document.getElementById('rat-race-badge');
    if (data.status === 'fast_track') {
      badge.textContent = 'FAST TRACK 🚀';
      badge.className = 'text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-600';
    } else {
      badge.textContent = 'RAT RACE 🐀';
      badge.className = 'text-xs font-bold px-3 py-1 rounded-full bg-red-100 text-red-600';
    }

    const passive = formatMoney(data.passiveIncome);
    const expenses = formatMoney(data.totalExpenses);
    document.getElementById('freedom-desc').textContent =
      (currentLang === 'th' ? `Passive income: ${passive} / ค่าใช้จ่าย: ${expenses}` : `Passive: ${passive} / Expenses: ${expenses}`);

    // Milestones
    ['m25', 'm50', 'm75', 'm100'].forEach((id, i) => {
      const threshold = (i + 1) * 25;
      const el = document.getElementById(id);
      if (ratio >= threshold) {
        el.querySelector('div').className = 'w-6 h-6 rounded-full bg-green-400 mx-auto mb-1 flex items-center justify-center';
        el.querySelector('span').className = 'text-green-600 font-semibold';
      }
    });

    // Load cashflow for monthly flow display
    const stmt = await API.getIncomeStatement();
    const cf = stmt.cashflow || 0;
    document.getElementById('monthly-cashflow').textContent = formatMoney(cf);
    document.getElementById('monthly-cashflow').className = 'font-semibold ' + (cf >= 0 ? 'positive' : 'negative');
  } catch (e) {
    console.error(e);
  }
}

async function loadIncomeChart() {
  try {
    const now = new Date();
    const stmt = await API.getIncomeStatement(now.getMonth() + 1, now.getFullYear());
    const ctx = document.getElementById('incomeExpenseChart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [
          currentLang === 'th' ? 'รายรับรวม' : 'Total Income',
          currentLang === 'th' ? 'รายจ่ายรวม' : 'Total Expenses'
        ],
        datasets: [{
          data: [stmt.income.total || 0, stmt.expenses.total || 0],
          backgroundColor: ['#22c55e', '#ef4444'],
          borderRadius: 8,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: v => '฿' + v.toLocaleString()
            }
          }
        }
      }
    });
  } catch (e) {
    console.error(e);
  }
}

async function loadRecentTransactions() {
  const el = document.getElementById('recent-transactions');
  try {
    const now = new Date();
    const txs = await API.getTransactions(now.getMonth() + 1, now.getFullYear());
    const recent = txs.slice(-5).reverse();
    if (!recent.length) {
      el.innerHTML = `<p class="text-gray-400 text-center py-4">${currentLang === 'th' ? 'ยังไม่มีรายการ' : 'No transactions yet'}</p>`;
      return;
    }
    el.innerHTML = recent.map(tx => `
      <div class="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'income' ? 'bg-green-100' : 'bg-red-100'}">
            <i class="fas ${tx.type === 'income' ? 'fa-arrow-down text-green-500' : 'fa-arrow-up text-red-500'} text-xs"></i>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-700">${tx.description || tx.category}</p>
            <p class="text-xs text-gray-400">${tx.date} · ${tx.category}</p>
          </div>
        </div>
        <span class="font-semibold text-sm ${tx.type === 'income' ? 'positive' : 'negative'}">
          ${tx.type === 'income' ? '+' : '-'}${formatMoney(tx.amount)}
        </span>
      </div>
    `).join('');
  } catch (e) {
    el.innerHTML = `<p class="text-red-400 text-center py-4">${currentLang === 'th' ? 'โหลดข้อมูลไม่ได้' : 'Failed to load'}</p>`;
  }
}
