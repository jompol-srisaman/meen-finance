// insurance.js

let allInsurance = [];
let walletFilter = 'all';
let typeFilter = 'all';

const INS_TYPE_LABEL = {
  life: 'ประกันชีวิต',
  health: 'ประกันสุขภาพ',
  accident: 'ประกันอุบัติเหตุ',
  vehicle: 'ประกันรถยนต์',
  property: 'ประกันทรัพย์สิน',
  other: 'อื่นๆ'
};

const INS_TYPE_COLOR = {
  life:     'bg-blue-100 text-blue-600',
  health:   'bg-green-100 text-green-600',
  accident: 'bg-orange-100 text-orange-600',
  vehicle:  'bg-purple-100 text-purple-600',
  property: 'bg-yellow-100 text-yellow-600',
  other:    'bg-gray-100 text-gray-600'
};

const INS_TYPE_ICON = {
  life:     'fa-heart-pulse',
  health:   'fa-hospital',
  accident: 'fa-person-falling',
  vehicle:  'fa-car',
  property: 'fa-house',
  other:    'fa-shield-halved'
};

document.addEventListener('DOMContentLoaded', () => {
  loadInsurance();
  setWalletFilter('all');
  setTypeFilter('all');
});

function setWalletFilter(w) {
  walletFilter = w;
  ['all','personal','family'].forEach(id => {
    const btn = document.getElementById('wf-' + id);
    if (!btn) return;
    btn.style.cssText = id === w
      ? 'background:var(--primary);color:white;border-color:var(--primary)'
      : 'background:transparent;color:var(--text-muted);border-color:var(--divider)';
  });
  renderList();
}

function setTypeFilter(t) {
  typeFilter = t;
  ['all','life','health','accident','vehicle','property'].forEach(id => {
    const btn = document.getElementById('tf-' + id);
    if (!btn) return;
    btn.style.cssText = id === t
      ? 'background:var(--primary);color:white'
      : 'background:var(--bg);color:var(--text-muted)';
  });
  renderList();
}

async function loadInsurance() {
  const el = document.getElementById('ins-list');
  try {
    const data = await API.getInsuranceSummary();
    allInsurance = data.list || [];

    document.getElementById('hdr-count').textContent = (data.count || 0) + ' ฉบับ';
    document.getElementById('hdr-monthly').textContent = formatMoney(data.totalMonthly || 0);
    document.getElementById('hdr-annual').textContent = formatMoney(data.totalAnnual || 0);

    renderList();
  } catch (e) {
    el.innerHTML = `<div class="text-center py-8 text-red-400"><i class="fas fa-exclamation-circle text-3xl mb-2 block"></i><p>โหลดไม่ได้</p></div>`;
  }
}

function renderList() {
  const el = document.getElementById('ins-list');
  let items = allInsurance;

  if (walletFilter !== 'all') {
    items = items.filter(i => (i.wallet || 'personal') === walletFilter);
  }
  if (typeFilter !== 'all') {
    items = items.filter(i => i.type === typeFilter);
  }

  if (!items.length) {
    el.innerHTML = `<div class="text-center py-12" style="color:var(--text-sub)"><i class="fas fa-shield-halved text-4xl mb-3 block"></i><p>ยังไม่มีกรมธรรม์</p></div>`;
    return;
  }

  el.innerHTML = items.map(ins => {
    const expiry = ins.end_date ? daysUntil(ins.end_date) : null;
    const expiryClass = expiry !== null && expiry <= 30 ? 'text-red-500' : 'text-gray-400';
    const expiryText = expiry === null ? '' : expiry < 0 ? 'หมดอายุแล้ว' : expiry === 0 ? 'หมดวันนี้!' : `อีก ${expiry} วัน`;

    return `
    <div class="app-card rounded-xl shadow-sm border p-4 mb-3">
      <div class="flex items-start justify-between gap-2">
        <div class="flex items-start gap-3 flex-1 min-w-0">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${INS_TYPE_COLOR[ins.type] || 'bg-gray-100 text-gray-600'}">
            <i class="fas ${INS_TYPE_ICON[ins.type] || 'fa-shield-halved'}"></i>
          </div>
          <div class="min-w-0">
            <p class="font-semibold text-sm" style="color:var(--text)">${ins.name}</p>
            <p class="text-xs mt-0.5" style="color:var(--text-muted)">${ins.provider || '—'}</p>
            <div class="flex flex-wrap gap-1 mt-1.5">
              <span class="text-xs rounded-full px-2 py-0.5 ${INS_TYPE_COLOR[ins.type] || 'bg-gray-100 text-gray-600'}">${INS_TYPE_LABEL[ins.type] || ins.type}</span>
              <span class="text-xs rounded-full px-2 py-0.5 bg-gray-100" style="color:var(--text-muted)">${ins.wallet === 'family' ? '👨‍👩‍👧 ครอบครัว' : '👤 ส่วนตัว'}</span>
            </div>
          </div>
        </div>
        <div class="text-right flex-shrink-0">
          <p class="font-bold text-sm" style="color:var(--primary)">${formatMoney(ins.premium_monthly)}<span class="text-xs font-normal" style="color:var(--text-sub)">/เดือน</span></p>
          <p class="text-xs mt-0.5" style="color:var(--text-muted)">คุ้มครอง ${formatMoney(ins.coverage_amount)}</p>
        </div>
      </div>
      ${ins.end_date ? `<div class="flex justify-between items-center mt-3 pt-2 border-t" style="border-color:var(--divider)">
        <p class="text-xs" style="color:var(--text-muted)">สิ้นสุด: ${formatDateShort(ins.end_date)}</p>
        <p class="text-xs font-medium ${expiryClass}">${expiryText}</p>
      </div>` : ''}
      ${ins.notes ? `<p class="text-xs mt-2" style="color:var(--text-muted)">📝 ${ins.notes}</p>` : ''}
      <div class="mt-3">
        <button onclick="deleteIns('${ins.id}')" class="w-full rounded-lg py-1.5 text-xs font-medium bg-red-50 text-red-500">ลบ</button>
      </div>
    </div>`;
  }).join('');
}

function daysUntil(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(dateStr); target.setHours(0,0,0,0);
  return Math.round((target - today) / 86400000);
}

function formatDateShort(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
}

function openModal() {
  document.getElementById('ins-name').value = '';
  document.getElementById('ins-provider').value = '';
  document.getElementById('ins-premium').value = '';
  document.getElementById('ins-coverage').value = '';
  document.getElementById('ins-notes').value = '';
  document.getElementById('ins-start').value = new Date().toISOString().split('T')[0];
  document.getElementById('ins-end').value = '';
  document.getElementById('ins-wallet').value = 'personal';
  document.getElementById('ins-type').value = 'life';
  document.getElementById('ins-modal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('ins-modal').classList.add('hidden');
}

async function saveInsurance() {
  const name = document.getElementById('ins-name').value.trim();
  const premium = parseFloat(document.getElementById('ins-premium').value);
  if (!name) { alert('กรุณากรอกชื่อกรมธรรม์'); return; }
  if (!premium || premium <= 0) { alert('กรุณากรอกเบี้ยประกัน'); return; }

  const btn = document.getElementById('ins-save-btn');
  btn.textContent = 'กำลังบันทึก...';
  btn.disabled = true;

  try {
    await API.addInsurance({
      name,
      type: document.getElementById('ins-type').value,
      provider: document.getElementById('ins-provider').value,
      premium_monthly: premium,
      coverage_amount: parseFloat(document.getElementById('ins-coverage').value) || 0,
      start_date: document.getElementById('ins-start').value,
      end_date: document.getElementById('ins-end').value,
      wallet: document.getElementById('ins-wallet').value,
      notes: document.getElementById('ins-notes').value,
    });
    closeModal();
    loadInsurance();
  } catch (e) {
    alert('บันทึกไม่สำเร็จ กรุณาลองใหม่');
  } finally {
    btn.textContent = 'บันทึก';
    btn.disabled = false;
  }
}

async function deleteIns(id) {
  if (!confirm('ลบกรมธรรม์นี้?')) return;
  await API.deleteInsurance(id);
  loadInsurance();
}
