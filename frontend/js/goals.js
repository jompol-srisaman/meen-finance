// goals.js

document.addEventListener('DOMContentLoaded', () => {
  loadGoals();
});

async function loadGoals() {
  const el = document.getElementById('goals-list');
  try {
    const goals = await API.getGoals();
    if (!goals.length) {
      el.innerHTML = `<div class="text-center py-12 text-gray-400"><i class="fas fa-bullseye text-4xl mb-3"></i><p>ยังไม่มีเป้าหมาย<br>เริ่มตั้งเป้าหมายแรกของคุณได้เลย!</p></div>`;
      return;
    }

    el.innerHTML = goals.map(g => {
      const target = parseFloat(g.target_amount) || 0;
      const current = parseFloat(g.current_amount) || 0;
      const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
      const remaining = Math.max(target - current, 0);
      const isComplete = pct >= 100;

      return `
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-3">
          <div class="flex justify-between items-start mb-3">
            <div>
              <p class="font-semibold text-gray-700">${g.name}</p>
              <span class="text-xs rounded-full px-2 py-0.5 mt-1 inline-block ${goalTypeBadge(g.type)}">${goalTypeLabel(g.type)}</span>
            </div>
            <div class="text-right">
              ${isComplete ? '<span class="text-xl">🏆</span>' : `<span class="text-2xl font-bold text-orange-500">${pct.toFixed(0)}%</span>`}
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden mb-2">
            <div class="h-3 rounded-full transition-all duration-700 ${isComplete ? 'bg-green-500' : 'bg-gradient-to-r from-orange-400 to-orange-600'}"
              style="width:${pct}%"></div>
          </div>

          <div class="flex justify-between text-xs text-gray-500 mb-3">
            <span>${formatMoney(current)}</span>
            <span class="text-gray-400">${isComplete ? '✅ สำเร็จแล้ว!' : `เหลืออีก ${formatMoney(remaining)}`}</span>
            <span>${formatMoney(target)}</span>
          </div>

          ${g.target_date ? `<p class="text-xs text-gray-400 mb-3"><i class="fas fa-calendar-alt mr-1"></i>ถึง ${formatGoalDate(g.target_date)}</p>` : ''}

          ${!isComplete ? `
            <button onclick="openProgressModal('${g.id}', '${g.name}', ${current})"
              class="w-full bg-orange-50 text-orange-500 rounded-xl py-2 text-sm font-medium">
              อัพเดทความก้าวหน้า
            </button>
          ` : ''}
        </div>
      `;
    }).join('');
  } catch (e) {
    el.innerHTML = `<p class="text-red-400 text-center py-4">โหลดไม่ได้ กรุณาลองใหม่</p>`;
  }
}

function formatGoalDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
}

function goalTypeLabel(k) {
  return { savings: 'เงินออม', emergency_fund: 'กองทุนฉุกเฉิน', investment: 'การลงทุน', debt_payoff: 'ปิดหนี้' }[k] || k;
}

function goalTypeBadge(k) {
  return {
    savings: 'bg-blue-100 text-blue-600',
    emergency_fund: 'bg-yellow-100 text-yellow-600',
    investment: 'bg-green-100 text-green-600',
    debt_payoff: 'bg-red-100 text-red-500'
  }[k] || 'bg-gray-100 text-gray-600';
}

function openModal() {
  document.getElementById('modal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
}

function openProgressModal(id, name, current) {
  document.getElementById('progress-id').value = id;
  document.getElementById('progress-title').textContent = name;
  document.getElementById('progress-amount').value = current || '';
  document.getElementById('progress-modal').classList.remove('hidden');
  document.getElementById('progress-amount').focus();
}

function closeProgressModal() {
  document.getElementById('progress-modal').classList.add('hidden');
}

async function saveGoal() {
  const name = document.getElementById('g-name').value.trim();
  const target = parseFloat(document.getElementById('g-target').value);
  if (!name || !target) { alert('กรุณากรอกชื่อและเป้าหมาย'); return; }

  await API.addGoal({
    name,
    type: document.getElementById('g-type').value,
    target_amount: target,
    current_amount: parseFloat(document.getElementById('g-current').value) || 0,
    target_date: document.getElementById('g-date').value,
    status: 'active'
  });
  closeModal();
  loadGoals();
}

async function saveProgress() {
  const id = document.getElementById('progress-id').value;
  const amount = parseFloat(document.getElementById('progress-amount').value);
  if (!id || isNaN(amount)) { alert('กรุณากรอกจำนวน'); return; }

  await API.updateGoal({ id, current_amount: amount });
  closeProgressModal();
  loadGoals();
}
