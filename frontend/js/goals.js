// goals.js — with grouping: approaching / in-progress / completed

let allGoals = [];
let activeFilter = 'all';

const AUTO_SYNC_TYPES = ['savings', 'investment', 'debt_payoff', 'emergency_fund', 'monthly_cashflow'];

document.addEventListener('DOMContentLoaded', () => {
  loadGoals();
});

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(dateStr); target.setHours(0,0,0,0);
  return Math.round((target - today) / 86400000);
}

function formatGoalDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
}

function goalTypeLabel(k) {
  return { savings: 'เงินออม', emergency_fund: 'กองทุนฉุกเฉิน', investment: 'การลงทุน', debt_payoff: 'ปิดหนี้', monthly_cashflow: 'Cashflow รายเดือน', other: 'อื่นๆ' }[k] || k;
}

function goalTypeBadge(k) {
  return {
    savings: 'bg-blue-100 text-blue-600',
    emergency_fund: 'bg-yellow-100 text-yellow-700',
    investment: 'bg-green-100 text-green-600',
    debt_payoff: 'bg-red-100 text-red-500',
    other: 'bg-gray-100 text-gray-600'
  }[k] || 'bg-gray-100 text-gray-600';
}

function classifyGoal(g) {
  const pct = getPct(g);
  if (g.status === 'completed' || pct >= 100) return 'completed';
  const days = daysUntil(g.target_date);
  if (pct >= 70 || (days !== null && days <= 60)) return 'approaching';
  return 'active';
}

function getPct(g) {
  const target = parseFloat(g.target_amount) || 0;
  const current = parseFloat(g.current_amount) || 0;
  return target > 0 ? Math.min((current / target) * 100, 100) : 0;
}

async function loadGoals() {
  const el = document.getElementById('goals-container');
  el.innerHTML = '<div class="flex justify-center p-8"><div class="animate-spin rounded-full h-8 w-8 border-b-2" style="border-color:var(--primary)"></div></div>';
  try {
    allGoals = await API.getGoals();
    renderGoals();
    updateSummary();
  } catch (e) {
    el.innerHTML = `<div class="text-center py-8 text-red-400"><i class="fas fa-exclamation-circle text-3xl mb-2 block"></i><p>โหลดไม่ได้ กรุณาลองใหม่</p></div>`;
  }
}

function updateSummary() {
  const total = allGoals.length;
  const completed = allGoals.filter(g => classifyGoal(g) === 'completed').length;
  const approaching = allGoals.filter(g => classifyGoal(g) === 'approaching').length;
  document.getElementById('sum-total').textContent = total;
  document.getElementById('sum-completed').textContent = completed;
  document.getElementById('sum-approaching').textContent = approaching;
}

function setFilter(f) {
  activeFilter = f;
  ['all', 'approaching', 'active', 'completed'].forEach(id => {
    const btn = document.getElementById('f-' + id);
    if (!btn) return;
    btn.style.cssText = id === f
      ? 'background:var(--primary);color:white;border-color:var(--primary)'
      : 'background:transparent;color:var(--text-muted);border-color:var(--divider)';
  });
  renderGoals();
}

function renderGoals() {
  const el = document.getElementById('goals-container');

  let goals = allGoals;
  if (activeFilter !== 'all') {
    goals = goals.filter(g => classifyGoal(g) === activeFilter);
  }

  if (!goals.length) {
    el.innerHTML = `<div class="text-center py-12" style="color:var(--text-sub)">
      <i class="fas fa-bullseye text-4xl mb-3 block"></i>
      <p>${activeFilter === 'completed' ? 'ยังไม่มีเป้าหมายที่สำเร็จ' : activeFilter === 'approaching' ? 'ยังไม่มีเป้าหมายที่ใกล้ถึง' : 'ยังไม่มีเป้าหมาย กด + เพื่อเริ่มต้น!'}</p>
    </div>`;
    return;
  }

  if (activeFilter === 'all') {
    // Group display
    const groups = [
      { key: 'approaching', icon: '⚡', label: 'ใกล้ถึงแล้ว', color: '#f97316' },
      { key: 'active',      icon: '📈', label: 'กำลังดำเนินการ', color: 'var(--primary)' },
      { key: 'completed',   icon: '🏆', label: 'สำเร็จแล้ว', color: '#16a34a' },
    ];
    let html = '';
    groups.forEach(grp => {
      const items = goals.filter(g => classifyGoal(g) === grp.key);
      if (!items.length) return;
      html += `
        <div class="mb-2">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-lg">${grp.icon}</span>
            <h3 class="font-bold text-sm" style="color:${grp.color}">${grp.label}</h3>
            <span class="text-xs font-medium px-2 py-0.5 rounded-full" style="background:${grp.color}20;color:${grp.color}">${items.length}</span>
          </div>
          ${items.map(g => goalCard(g)).join('')}
        </div>`;
    });
    el.innerHTML = html || '<p class="text-center py-8" style="color:var(--text-sub)">ยังไม่มีเป้าหมาย</p>';
  } else {
    el.innerHTML = goals.map(g => goalCard(g)).join('');
  }
}

function goalCard(g) {
  const pct = getPct(g);
  const target = parseFloat(g.target_amount) || 0;
  const current = parseFloat(g.current_amount) || 0;
  const remaining = Math.max(target - current, 0);
  const days = daysUntil(g.target_date);
  const classification = classifyGoal(g);
  const isCompleted = classification === 'completed';

  let daysText = '';
  let daysClass = 'style="color:var(--text-muted)"';
  if (days !== null) {
    if (days < 0) { daysText = 'เลยกำหนดแล้ว'; daysClass = 'style="color:#ef4444"'; }
    else if (days === 0) { daysText = 'ถึงกำหนดวันนี้!'; daysClass = 'style="color:#ef4444;font-weight:700"'; }
    else if (days <= 30) { daysText = `⚠️ อีก ${days} วัน`; daysClass = 'style="color:#f97316;font-weight:600"'; }
    else { daysText = `อีก ${days} วัน`; }
  }

  // Monthly saving needed
  let monthlyNeeded = '';
  if (!isCompleted && days !== null && days > 0 && remaining > 0) {
    const months = days / 30;
    const perMonth = remaining / months;
    monthlyNeeded = `<p class="text-xs mt-1" style="color:var(--text-muted)">💰 ต้องออมเพิ่ม <span class="font-semibold" style="color:var(--primary)">${formatMoney(perMonth)}/เดือน</span></p>`;
  }

  const wallet = g.wallet || 'personal';
  const walletBadge = wallet === 'family' ? '👨‍👩‍👧 ครอบครัว' : '👤 ส่วนตัว';

  return `
  <div class="app-card rounded-2xl border p-4 mb-3 ${isCompleted ? 'opacity-70' : ''}">
    <div class="flex justify-between items-start mb-3">
      <div class="flex-1 min-w-0">
        <p class="font-semibold" style="color:var(--text)">${g.name}</p>
        <div class="flex flex-wrap gap-1 mt-1">
          <span class="text-xs rounded-full px-2 py-0.5 ${goalTypeBadge(g.type)}">${goalTypeLabel(g.type)}</span>
          <span class="text-xs rounded-full px-2 py-0.5 bg-gray-100" style="color:var(--text-muted)">${walletBadge}</span>
          ${AUTO_SYNC_TYPES.includes(g.type) ? '<span class="text-xs rounded-full px-2 py-0.5 bg-blue-50 text-blue-400">🔄 auto</span>' : ''}
        </div>
      </div>
      <div class="text-right ml-3 flex-shrink-0">
        ${isCompleted
          ? '<span class="text-2xl">🏆</span>'
          : `<span class="text-xl font-bold" style="color:${pct >= 70 ? '#f97316' : 'var(--primary)'}">${pct.toFixed(0)}%</span>`
        }
      </div>
    </div>

    <!-- Progress bar -->
    <div class="w-full rounded-full h-3 overflow-hidden mb-2" style="background:var(--divider)">
      <div class="h-3 rounded-full transition-all duration-700 ${isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-blue-400 to-blue-600'}"
        style="width:${pct}%"></div>
    </div>

    <div class="flex justify-between text-xs mb-2" style="color:var(--text-muted)">
      <span>${formatMoney(current)}</span>
      <span>${isCompleted ? '✅ สำเร็จแล้ว!' : `เหลือ ${formatMoney(remaining)}`}</span>
      <span>${formatMoney(target)}</span>
    </div>

    ${g.target_date ? `<p class="text-xs mb-1"><i class="fas fa-calendar-alt mr-1" style="color:var(--text-sub)"></i><span ${daysClass}>${formatGoalDate(g.target_date)} · ${daysText}</span></p>` : ''}
    ${monthlyNeeded}

    <!-- Actions -->
    <div class="flex gap-2 mt-3">
      ${!isCompleted ? `
        <button onclick="openUpdateModal('${g.id}','${g.name.replace(/'/g,"\\'")}',${current})"
          class="flex-1 rounded-xl py-2 text-sm font-medium text-white" style="background:var(--primary)">
          อัพเดท
        </button>
      ` : ''}
      ${pct >= 100 && !isCompleted ? `
        <button onclick="markComplete('${g.id}')" class="flex-1 rounded-xl py-2 text-sm font-medium bg-green-500 text-white">
          สำเร็จ! 🏆
        </button>
      ` : ''}
      <button onclick="deleteGoal('${g.id}')" class="rounded-xl py-2 px-3 text-sm font-medium bg-red-50 text-red-400">
        <i class="fas fa-trash-alt"></i>
      </button>
    </div>
  </div>`;
}

function openModal() {
  document.getElementById('g-name').value = '';
  document.getElementById('g-target').value = '';
  document.getElementById('g-current').value = '';
  document.getElementById('g-date').value = '';
  document.getElementById('g-notes').value = '';
  document.getElementById('g-type').value = 'savings';
  document.getElementById('g-wallet').value = 'personal';
  document.getElementById('modal').classList.remove('hidden');
  setTimeout(() => document.getElementById('g-name').focus(), 150);
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
}

function openUpdateModal(id, name, current) {
  document.getElementById('pu-id').value = id;
  document.getElementById('pu-title').textContent = name;
  document.getElementById('pu-amount').value = current || '';
  document.getElementById('update-modal').classList.remove('hidden');
  setTimeout(() => document.getElementById('pu-amount').focus(), 150);
}

function closeUpdateModal() {
  document.getElementById('update-modal').classList.add('hidden');
}

async function saveGoal() {
  const name = document.getElementById('g-name').value.trim();
  const target = parseFloat(document.getElementById('g-target').value);
  if (!name || !target) { alert('กรุณากรอกชื่อและจำนวนเป้าหมาย'); return; }

  const btn = document.getElementById('goal-save-btn');
  btn.textContent = 'กำลังบันทึก...';
  btn.disabled = true;
  try {
    await API.addGoal({
      name,
      type: document.getElementById('g-type').value,
      target_amount: target,
      current_amount: parseFloat(document.getElementById('g-current').value) || 0,
      target_date: document.getElementById('g-date').value,
      wallet: document.getElementById('g-wallet').value,
      notes: document.getElementById('g-notes').value,
      status: 'active'
    });
    closeModal();
    loadGoals();
  } catch (e) {
    alert('บันทึกไม่สำเร็จ กรุณาลองใหม่');
  } finally {
    btn.textContent = 'บันทึก';
    btn.disabled = false;
  }
}

async function saveUpdate() {
  const id = document.getElementById('pu-id').value;
  const amount = parseFloat(document.getElementById('pu-amount').value);
  if (!id || isNaN(amount)) { alert('กรุณากรอกจำนวน'); return; }
  const btn = document.getElementById('update-save-btn');
  btn.textContent = 'กำลังบันทึก...';
  btn.disabled = true;
  try {
    await API.updateGoal({ id, current_amount: amount });
    closeUpdateModal();
    loadGoals();
  } catch (e) {
    alert('อัพเดทไม่สำเร็จ');
  } finally {
    btn.textContent = 'อัพเดท';
    btn.disabled = false;
  }
}

async function markComplete(id) {
  try {
    await API.updateGoal({ id, status: 'completed' });
    loadGoals();
  } catch (e) { alert('อัพเดทไม่สำเร็จ กรุณาลองใหม่'); }
}

async function deleteGoal(id) {
  if (!confirm('ลบเป้าหมายนี้?')) return;
  try {
    await API.deleteGoal(id);
    loadGoals();
  } catch (e) { alert('ลบไม่สำเร็จ กรุณาลองใหม่'); }
}

// ── Auto-Sync from Financial Data ────────────────────────────

async function syncGoals() {
  const btn = document.getElementById('sync-btn');
  if (btn) {
    btn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i><span class="text-sm">กำลังอัปเดต...</span>';
    btn.disabled = true;
  }
  try {
    const result = await API.syncGoalsProgress();
    await loadGoals();
    const count = result.synced || 0;
    showGoalToast(count > 0 ? `✅ อัปเดต ${count} เป้าหมายจากข้อมูลจริงแล้ว` : 'ไม่มีเป้าหมายที่อัปเดตอัตโนมัติได้');
  } catch (e) {
    showGoalToast('อัปเดตไม่สำเร็จ กรุณาลองใหม่');
  } finally {
    if (btn) {
      btn.innerHTML = '<i class="fas fa-sync-alt"></i><span class="text-sm">อัปเดต</span>';
      btn.disabled = false;
    }
  }
}

function showGoalToast(msg) {
  const old = document.getElementById('goal-toast');
  if (old) old.remove();
  const t = document.createElement('div');
  t.id = 'goal-toast';
  t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1e293b;color:white;font-size:0.85rem;padding:0.6rem 1.25rem;border-radius:99px;z-index:100;box-shadow:0 4px 12px rgba(0,0,0,0.2);white-space:nowrap;max-width:90vw;text-align:center';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}
