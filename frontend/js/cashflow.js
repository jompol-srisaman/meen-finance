// cashflow.js

let currentMilestones = [];
let currentRatio = 0;

document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([loadFreedomMeter(), loadIncomeStatement(), loadBalanceSheet(), loadLadder()]);
  renderLadder();
});

// ── Freedom Meter ─────────────────────────────────────────────

async function loadFreedomMeter() {
  try {
    const data = await API.getFreedomMeter();
    const ratio = data.ratio || 0;
    currentRatio = ratio;
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
      statusSub.textContent = 'คุณบรรลุอิสรภาพทางการเงินแล้ว! 🎉';
    } else {
      banner.className = 'rounded-2xl p-4 text-center bg-red-50';
      statusText.className = 'text-xl font-bold text-red-600';
      statusText.textContent = 'RAT RACE 🐀';
      const needed = data.totalExpenses - data.passiveIncome;
      statusSub.className = 'text-sm mt-1 text-red-500';
      statusSub.textContent = `ต้องการ passive income เพิ่ม ${formatMoney(needed)} / เดือน`;
    }
  } catch (e) {
    console.error(e);
  }
}

// ── RAT RACE Ladder ───────────────────────────────────────────

async function loadLadder() {
  try {
    currentMilestones = await API.getMilestones();
  } catch (e) {
    currentMilestones = [];
  }
}

function renderLadder() {
  const container = document.getElementById('ladder-container');
  if (!container) return;
  if (!currentMilestones.length) {
    container.innerHTML = '<p class="text-sm text-center py-4" style="color:var(--text-muted)">ยังไม่มีขั้นบันได กด "ปรับขั้น" เพื่อตั้งค่า</p>';
    return;
  }

  // Sort descending so highest % is at top (goal is at top of ladder)
  const sorted = [...currentMilestones].sort((a, b) => b.pct - a.pct);

  // Current stage = highest milestone whose pct <= currentRatio
  const passed = currentMilestones.filter(m => m.pct <= currentRatio).sort((a, b) => b.pct - a.pct);
  const currentStage = passed.length ? passed[0] : null;
  // Next target = lowest milestone whose pct > currentRatio
  const future = currentMilestones.filter(m => m.pct > currentRatio).sort((a, b) => a.pct - b.pct);
  const nextTarget = future.length ? future[0] : null;

  container.innerHTML = sorted.map(m => {
    const isCurrentStage = currentStage && m.pct === currentStage.pct;
    const isPassed = m.pct < currentRatio;
    const isFuture = m.pct > currentRatio;

    let bg, borderStyle, textColor, badge;

    if (isCurrentStage) {
      bg = 'var(--primary-light)';
      borderStyle = `border:2px solid var(--primary)`;
      textColor = 'var(--primary)';
      badge = `<span class="text-xs font-bold px-2 py-0.5 rounded-full text-white" style="background:var(--primary)">📍 ${currentRatio.toFixed(0)}%</span>`;
    } else if (isPassed) {
      bg = '#f0fdf4';
      borderStyle = 'border:1px solid #bbf7d0';
      textColor = '#15803d';
      badge = `<span class="text-green-500 text-lg"><i class="fas fa-check-circle"></i></span>`;
    } else {
      bg = 'var(--bg)';
      borderStyle = 'border:1px solid var(--divider)';
      textColor = 'var(--text-sub)';
      badge = `<span style="color:var(--divider)"><i class="fas fa-lock text-sm"></i></span>`;
    }

    const needPct = nextTarget && isCurrentStage ? nextTarget.pct - currentRatio : null;

    return `
    <div class="rounded-xl p-3 mb-2 flex items-center justify-between" style="background:${bg};${borderStyle}">
      <div class="flex items-center gap-3">
        <span class="text-2xl">${m.emoji}</span>
        <div>
          <p class="font-bold text-sm" style="color:${textColor}">${m.label}</p>
          <p class="text-xs" style="color:var(--text-muted)">${m.pct}% Freedom Ratio${needPct !== null ? ` · ต้องเพิ่มอีก ${needPct.toFixed(1)}%` : ''}</p>
        </div>
      </div>
      ${badge}
    </div>`;
  }).join('');
}

// ── Ladder Editor ─────────────────────────────────────────────

function openLadderEditor() {
  const sorted = [...currentMilestones].sort((a, b) => a.pct - b.pct);
  document.getElementById('milestone-rows').innerHTML = sorted.map(m => milestoneRowHTML(m)).join('');
  document.getElementById('ladder-modal').classList.remove('hidden');
}

function closeLadderModal() {
  document.getElementById('ladder-modal').classList.add('hidden');
}

function milestoneRowHTML(m) {
  return `
  <div class="ms-row flex gap-2 items-center mb-2">
    <input type="text" value="${m.emoji}" maxlength="2" class="app-input border rounded-lg px-2 py-2 text-center text-xl w-12 focus:outline-none" data-field="emoji">
    <input type="number" value="${m.pct}" min="0" max="999" class="app-input border rounded-lg px-2 py-2 w-16 text-sm text-center focus:outline-none" placeholder="%" data-field="pct">
    <input type="text" value="${m.label}" class="app-input border rounded-lg px-3 py-2 flex-1 text-sm focus:outline-none" placeholder="ชื่อขั้น" data-field="label">
    <button onclick="this.closest('.ms-row').remove()" class="w-8 h-8 rounded-lg bg-red-50 text-red-400 flex-shrink-0 flex items-center justify-center"><i class="fas fa-times text-xs"></i></button>
  </div>`;
}

function addMilestoneRow() {
  const rows = document.getElementById('milestone-rows');
  const div = document.createElement('div');
  div.innerHTML = milestoneRowHTML({ emoji: '⭐', pct: 0, label: '' });
  rows.appendChild(div.firstElementChild);
}

async function saveLadder() {
  const rows = document.querySelectorAll('#milestone-rows .ms-row');
  const milestones = [];
  rows.forEach(row => {
    const emoji = row.querySelector('[data-field="emoji"]').value.trim() || '⭐';
    const pct = parseFloat(row.querySelector('[data-field="pct"]').value) || 0;
    const label = row.querySelector('[data-field="label"]').value.trim();
    if (label) milestones.push({ emoji, pct, label });
  });
  if (!milestones.length) { showCfToast('กรุณาเพิ่มขั้นบันไดอย่างน้อย 1 ขั้น'); return; }

  const btn = document.querySelector('#ladder-modal .modal-footer button');
  btn.textContent = 'กำลังบันทึก...';
  btn.disabled = true;
  try {
    await API.saveMilestones(milestones);
    currentMilestones = milestones;
    closeLadderModal();
    renderLadder();
    showCfToast('บันทึกขั้นบันไดแล้ว ✅');
  } catch (e) {
    showCfToast('บันทึกไม่สำเร็จ กรุณาลองใหม่');
  } finally {
    btn.textContent = 'บันทึก';
    btn.disabled = false;
  }
}

// ── Income Statement ──────────────────────────────────────────

async function loadIncomeStatement() {
  try {
    const stmt = await API.getIncomeStatement();
    const income = stmt.income;
    const expenses = stmt.expenses;

    const incomeRows = [
      { label: 'เงินเดือน', value: income.salary },
      { label: 'Passive Income', value: income.passive },
      { label: 'Portfolio', value: income.portfolio },
    ];
    document.getElementById('income-rows').innerHTML = incomeRows.map(r => `
      <div class="row-item">
        <span class="text-gray-600 truncate text-xs">${r.label}</span>
        <span class="text-green-600 text-xs font-medium ml-1">${formatMoney(r.value)}</span>
      </div>
    `).join('');
    document.getElementById('total-income').textContent = formatMoney(income.total);

    const expenseTypes = Object.entries(expenses).filter(([k]) => k !== 'total');
    document.getElementById('expense-rows').innerHTML = expenseTypes.map(([k, v]) => `
      <div class="row-item">
        <span class="text-gray-600 truncate text-xs">${expenseLabelTh(k)}</span>
        <span class="text-red-500 text-xs font-medium ml-1">${formatMoney(v)}</span>
      </div>
    `).join('') || '<p class="text-xs text-gray-400">ยังไม่มีรายจ่าย</p>';
    document.getElementById('total-expenses').textContent = formatMoney(expenses.total);

    const cf = stmt.cashflow || 0;
    const cfEl = document.getElementById('monthly-cf');
    cfEl.textContent = (cf >= 0 ? '+' : '') + formatMoney(cf);
    cfEl.className = 'text-xl font-bold ' + (cf >= 0 ? 'positive' : 'negative');

    const ctx = document.getElementById('incomeDonut').getContext('2d');
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Salary', 'Passive', 'Portfolio'],
        datasets: [{ data: [income.salary, income.passive, income.portfolio], backgroundColor: ['#3b82f6', '#22c55e', '#a855f7'], borderWidth: 2 }]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } }, cutout: '65%' }
    });
  } catch (e) {
    console.error(e);
  }
}

// ── Balance Sheet ─────────────────────────────────────────────

async function loadBalanceSheet() {
  try {
    const data = await API.getBalanceSheet();

    const assetsByCat = {};
    (data.assets || []).forEach(a => { assetsByCat[a.category] = (assetsByCat[a.category] || 0) + (parseFloat(a.value) || 0); });
    document.getElementById('asset-rows').innerHTML = Object.entries(assetsByCat).map(([k, v]) => `
      <div class="row-item"><span class="text-gray-600 truncate text-xs">${assetLabelTh(k)}</span><span class="text-green-600 text-xs font-medium">${formatMoney(v)}</span></div>
    `).join('') || '<p class="text-xs text-gray-400">ยังไม่มีทรัพย์สิน</p>';
    document.getElementById('bs-total-assets').textContent = formatMoney(data.totalAssets);

    const liabByCat = {};
    (data.liabilities || []).forEach(l => { liabByCat[l.category] = (liabByCat[l.category] || 0) + (parseFloat(l.balance) || 0); });
    document.getElementById('liability-rows').innerHTML = Object.entries(liabByCat).map(([k, v]) => `
      <div class="row-item"><span class="text-gray-600 truncate text-xs">${liabilityLabelTh(k)}</span><span class="text-red-500 text-xs font-medium">${formatMoney(v)}</span></div>
    `).join('') || '<p class="text-xs text-gray-400">ยังไม่มีหนี้สิน</p>';
    document.getElementById('bs-total-liabilities').textContent = formatMoney(data.totalLiabilities);

    const nw = data.netWorth || 0;
    const nwEl = document.getElementById('net-worth');
    nwEl.textContent = formatMoney(nw);
    nwEl.className = 'text-xl font-bold ' + (nw >= 0 ? 'positive' : 'negative');
  } catch (e) {
    console.error(e);
  }
}

// ── Label Maps ────────────────────────────────────────────────

function expenseLabelTh(key) {
  return { tax:'ภาษี', mortgage:'ผ่อนบ้าน', car_payment:'ผ่อนรถ', credit_card:'บัตรเครดิต', food:'อาหาร', transport:'เดินทาง', other:'อื่นๆ' }[key] || key;
}
function assetLabelTh(key) {
  return { savings:'เงินออม', stocks:'หุ้น', real_estate:'อสังหาฯ', business:'ธุรกิจ', other:'อื่นๆ' }[key] || key;
}
function liabilityLabelTh(key) {
  return { mortgage:'สินเชื่อบ้าน', car_loan:'สินเชื่อรถ', credit_card:'บัตรเครดิต', student_loan:'สินเชื่อการศึกษา', other:'อื่นๆ' }[key] || key;
}

// ── Toast ─────────────────────────────────────────────────────

function showCfToast(msg) {
  const old = document.getElementById('cf-toast');
  if (old) old.remove();
  const t = document.createElement('div');
  t.id = 'cf-toast';
  t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1e293b;color:white;font-size:0.85rem;padding:0.6rem 1.25rem;border-radius:99px;z-index:100;box-shadow:0 4px 12px rgba(0,0,0,0.2);white-space:nowrap';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2300);
}
