// dashboard.js

function setEl(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

document.addEventListener('DOMContentLoaded', async () => {
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'อรุณสวัสดิ์ ☀️' : hour < 18 ? 'สวัสดีตอนบ่าย 🌤' : 'สวัสดีตอนเย็น 🌙';
  setEl('greeting', greet);

  await Promise.all([loadBalanceSheet(), loadFreedomMeter(), loadIncomeChart(), loadRecentTransactions(), loadSavingsRate()]);
});

async function loadBalanceSheet() {
  try {
    const data = await API.getBalanceSheet();
    const nw = data.netWorth || 0;
    const nwEl = document.getElementById('net-worth');
    if (nwEl) {
      nwEl.textContent = formatMoney(nw);
      nwEl.className = 'text-3xl font-bold mt-1 ' + (nw >= 0 ? 'text-green-600' : 'text-red-500');
    }
    setEl('total-assets', formatMoney(data.totalAssets));
    setEl('total-liabilities', formatMoney(data.totalLiabilities));
  } catch (e) {
    setEl('net-worth', 'Error');
  }
}

async function loadFreedomMeter() {
  try {
    const data = await API.getFreedomMeter();
    const ratio = Math.min(data.ratio || 0, 100);

    const bar = document.getElementById('freedom-bar');
    if (bar) bar.style.width = ratio + '%';
    const pctEl = document.getElementById('freedom-pct');
    if (pctEl) { pctEl.textContent = (data.ratio || 0).toFixed(1) + '%'; }

    const badge = document.getElementById('rat-race-badge');
    if (badge) {
      if (data.status === 'fast_track') {
        badge.textContent = 'FAST TRACK 🚀';
        badge.className = 'text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-600';
      } else {
        badge.textContent = 'RAT RACE 🐀';
        badge.className = 'text-xs font-bold px-3 py-1 rounded-full bg-red-100 text-red-600';
      }
    }

    const passive = formatMoney(data.passiveIncome);
    const expenses = formatMoney(data.totalExpenses);
    setEl('freedom-desc', `Passive: ${passive} / ค่าใช้จ่าย: ${expenses}`);

    ['m25', 'm50', 'm75', 'm100'].forEach((id, i) => {
      const threshold = (i + 1) * 25;
      const el = document.getElementById(id);
      if (!el) return;
      if (ratio >= threshold) {
        const inner = el.querySelector('div');
        const span = el.querySelector('span');
        if (inner) inner.style.background = '#4ade80';
        if (span) span.style.color = '#16a34a';
      }
    });

    const stmt = await API.getIncomeStatement();
    const cf = stmt.cashflow || 0;
    const cfEl = document.getElementById('monthly-cashflow');
    if (cfEl) {
      cfEl.textContent = formatMoney(cf);
      cfEl.className = 'font-semibold ' + (cf >= 0 ? 'text-green-600' : 'text-red-500');
    }
  } catch (e) {
    console.error('loadFreedomMeter:', e);
  }
}

async function loadIncomeChart() {
  const canvas = document.getElementById('incomeExpenseChart');
  if (!canvas) return;
  try {
    const now = new Date();
    const txs = await API.getTransactions(now.getMonth() + 1, now.getFullYear());
    let income = 0, expense = 0;
    txs.forEach(t => {
      const amt = parseFloat(t.amount) || 0;
      if (t.type === 'income') income += amt;
      else expense += amt;
    });

    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['รายรับ', 'รายจ่าย'],
        datasets: [{
          data: [income, expense],
          backgroundColor: ['#22c55e', '#ef4444'],
          borderRadius: 8,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { callback: v => '฿' + v.toLocaleString() } }
        }
      }
    });
  } catch (e) {
    console.error('loadIncomeChart:', e);
  }
}

async function loadSavingsRate() {
  const pctEl = document.getElementById('savings-rate-pct');
  const descEl = document.getElementById('savings-rate-desc');
  const badgeEl = document.getElementById('savings-badge');
  if (!pctEl) return;
  try {
    const now = new Date();
    const txs = await API.getTransactions(now.getMonth() + 1, now.getFullYear());
    let income = 0, expense = 0;
    txs.forEach(t => {
      const amt = parseFloat(t.amount) || 0;
      if (t.type === 'income') income += amt;
      else expense += amt;
    });
    if (!income) {
      pctEl.textContent = '—';
      if (descEl) descEl.textContent = 'ยังไม่มีรายรับเดือนนี้';
      return;
    }
    const rate = ((income - expense) / income) * 100;
    pctEl.textContent = rate.toFixed(1) + '%';
    pctEl.style.color = rate >= 20 ? '#16a34a' : rate >= 10 ? '#d97706' : '#dc2626';
    if (descEl) descEl.textContent = `เซฟ ${formatMoney(income - expense)} จาก ${formatMoney(income)}`;
    if (badgeEl) {
      if (rate >= 50)       { badgeEl.textContent = '🏆 FIRE Track'; badgeEl.style.cssText = 'background:#dcfce7;color:#15803d'; }
      else if (rate >= 20)  { badgeEl.textContent = '🟢 ดี';         badgeEl.style.cssText = 'background:#dcfce7;color:#15803d'; }
      else if (rate >= 10)  { badgeEl.textContent = '🟡 พอได้';     badgeEl.style.cssText = 'background:#fef9c3;color:#92400e'; }
      else                   { badgeEl.textContent = '🔴 อันตราย';  badgeEl.style.cssText = 'background:#fee2e2;color:#b91c1c'; }
    }
  } catch (e) {
    if (pctEl) pctEl.textContent = '—';
  }
}

async function loadRecentTransactions() {
  const el = document.getElementById('recent-transactions');
  if (!el) return;
  try {
    const now = new Date();
    const txs = await API.getTransactions(now.getMonth() + 1, now.getFullYear());
    const recent = txs.slice(-5).reverse();
    if (!recent.length) {
      el.innerHTML = `<p class="text-center py-4" style="color:var(--text-sub)">ยังไม่มีรายการ</p>`;
      return;
    }
    el.innerHTML = recent.map(tx => `
      <div class="flex justify-between items-center py-2 border-b last:border-0" style="border-color:var(--divider)">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${tx.type === 'income' ? 'bg-green-100' : 'bg-red-100'}">
            <i class="fas ${tx.type === 'income' ? 'fa-arrow-down text-green-500' : 'fa-arrow-up text-red-500'} text-xs"></i>
          </div>
          <div>
            <p class="text-sm font-medium" style="color:var(--text)">${tx.description || tx.category}</p>
            <p class="text-xs" style="color:var(--text-sub)">${tx.date || ''} · ${tx.category}</p>
          </div>
        </div>
        <span class="font-semibold text-sm flex-shrink-0 ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'}">
          ${tx.type === 'income' ? '+' : '-'}${formatMoney(tx.amount)}
        </span>
      </div>
    `).join('');
  } catch (e) {
    el.innerHTML = `<p class="text-red-400 text-center py-4">โหลดข้อมูลไม่ได้</p>`;
  }
}
