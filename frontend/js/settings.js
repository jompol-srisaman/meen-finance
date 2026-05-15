// settings.js

document.addEventListener('DOMContentLoaded', () => {
  loadProfileName();
  applyLangButtons();
  highlightTheme(localStorage.getItem('theme') || 'sky');
  loadExpenseCategories();
  loadIncomeSources();
});

// ── Profile ───────────────────────────────────────────────────

function loadProfileName() {
  const name = localStorage.getItem('profileName') || 'Meen Finance';
  document.getElementById('profile-name').textContent = name;
  document.getElementById('avatar').textContent = name.charAt(0).toUpperCase();
}

function editName() {
  document.getElementById('new-name').value = localStorage.getItem('profileName') || '';
  openModal('name');
  setTimeout(() => document.getElementById('new-name').focus(), 150);
}

function saveName() {
  const name = document.getElementById('new-name').value.trim();
  if (!name) return;
  localStorage.setItem('profileName', name);
  closeAllModals();
  loadProfileName();
  showToast('บันทึกชื่อแล้ว ✅');
}

// ── Theme ─────────────────────────────────────────────────────

function applyTheme(theme) {
  localStorage.setItem('theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
  highlightTheme(theme);
  showToast({ sky: 'ธีม Sky ✅', midnight: 'ธีม Midnight ✅', emerald: 'ธีม Emerald ✅' }[theme] || '✅');
}

function highlightTheme(active) {
  ['sky', 'midnight', 'emerald'].forEach(t => {
    const card = document.getElementById('theme-' + t);
    const check = document.getElementById('check-' + t);
    if (!card) return;
    if (t === active) {
      card.classList.add('selected');
      check.style.opacity = '1';
    } else {
      card.classList.remove('selected');
      check.style.opacity = '0.25';
    }
  });
}

// ── Language ──────────────────────────────────────────────────

function applyLangButtons() {
  const lang = localStorage.getItem('lang') || 'th';
  document.getElementById('lang-th').classList.toggle('active', lang === 'th');
  document.getElementById('lang-en').classList.toggle('active', lang === 'en');
  document.getElementById('lang-sub').textContent = lang === 'th' ? 'ไทย' : 'English';
}

function setLang(lang) {
  localStorage.setItem('lang', lang);
  applyLangButtons();
  showToast(lang === 'th' ? 'เปลี่ยนเป็นภาษาไทย' : 'Changed to English');
}

// ── Expense Categories ────────────────────────────────────────

async function loadExpenseCategories() {
  const list = document.getElementById('expense-cat-list');
  const count = document.getElementById('exp-count');
  try {
    const cats = await API.getExpenseCategories();
    count.textContent = cats.length ? `(${cats.length})` : '';
    if (!cats.length) {
      list.innerHTML = '<div class="list-item"><span class="s-sub" style="color:var(--text-sub)">ยังไม่มีหมวดหมู่</span></div>';
      return;
    }
    const typeLabel = { mortgage:'ผ่อนบ้าน', car_payment:'ผ่อนรถ', credit_card:'บัตรเครดิต', food:'อาหาร', transport:'เดินทาง', tax:'ภาษี', other:'อื่นๆ' };
    list.innerHTML = cats.map(c => `
      <div class="list-item" id="cat-row-${c.id}">
        <div>
          <p class="s-title">${c.name}</p>
          <p class="s-sub">${typeLabel[c.type] || c.type} · ฿${Number(c.monthly_budget || 0).toLocaleString()}/เดือน</p>
        </div>
        <button class="del-btn" onclick="deleteExpenseCat('${c.id}')"><i class="fas fa-trash-alt"></i></button>
      </div>`).join('');
  } catch (e) {
    list.innerHTML = '<div class="list-item"><span class="s-sub text-red-400">โหลดไม่สำเร็จ</span></div>';
  }
}

async function deleteExpenseCat(id) {
  if (!confirm('ลบหมวดหมู่นี้?')) return;
  try {
    await API.deleteExpenseCategory(id);
    document.getElementById('cat-row-' + id)?.remove();
    showToast('ลบแล้ว ✅');
    loadExpenseCategories();
  } catch (e) {
    showToast('ลบไม่สำเร็จ ลองใหม่');
  }
}

async function saveExpenseCat() {
  const name = document.getElementById('cat-name').value.trim();
  const budget = parseFloat(document.getElementById('cat-budget').value);
  if (!name || isNaN(budget)) { showToast('กรุณากรอกข้อมูลให้ครบ'); return; }
  const btn = document.querySelector('#modal-expense-cat .modal-footer button');
  btn.disabled = true; btn.textContent = 'กำลังบันทึก...';
  try {
    await API.addExpenseCategory({ name, type: document.getElementById('cat-type').value, monthly_budget: budget });
    closeAllModals();
    document.getElementById('cat-name').value = '';
    document.getElementById('cat-budget').value = '';
    showToast('เพิ่มหมวดหมู่แล้ว ✅');
    loadExpenseCategories();
  } catch (e) {
    showToast('เกิดข้อผิดพลาด ลองใหม่');
  }
  btn.disabled = false; btn.textContent = 'บันทึก';
}

// ── Income Sources ────────────────────────────────────────────

async function loadIncomeSources() {
  const list = document.getElementById('income-source-list');
  const count = document.getElementById('income-count');
  try {
    const sources = await API.getIncomeSources();
    count.textContent = sources.length ? `(${sources.length})` : '';
    if (!sources.length) {
      list.innerHTML = '<div class="list-item"><span class="s-sub" style="color:var(--text-sub)">ยังไม่มีรายได้</span></div>';
      return;
    }
    const typeLabel = { salary:'เงินเดือน', passive:'Passive Income', portfolio:'Portfolio' };
    list.innerHTML = sources.map(s => `
      <div class="list-item" id="inc-row-${s.id}">
        <div>
          <p class="s-title">${s.name}</p>
          <p class="s-sub">${typeLabel[s.type] || s.type} · ฿${Number(s.monthly_amount || 0).toLocaleString()}/เดือน</p>
        </div>
        <button class="del-btn" onclick="deleteIncSrc('${s.id}')"><i class="fas fa-trash-alt"></i></button>
      </div>`).join('');
  } catch (e) {
    list.innerHTML = '<div class="list-item"><span class="s-sub text-red-400">โหลดไม่สำเร็จ</span></div>';
  }
}

async function deleteIncSrc(id) {
  if (!confirm('ลบรายได้นี้?')) return;
  try {
    await API.deleteIncomeSource(id);
    document.getElementById('inc-row-' + id)?.remove();
    showToast('ลบแล้ว ✅');
    loadIncomeSources();
  } catch (e) {
    showToast('ลบไม่สำเร็จ ลองใหม่');
  }
}

async function saveIncomeSrc() {
  const name = document.getElementById('inc-name').value.trim();
  const amount = parseFloat(document.getElementById('inc-amount').value);
  if (!name || isNaN(amount)) { showToast('กรุณากรอกข้อมูลให้ครบ'); return; }
  const btn = document.querySelector('#modal-income-src .modal-footer button');
  btn.disabled = true; btn.textContent = 'กำลังบันทึก...';
  try {
    await API.addIncomeSource({ name, type: document.getElementById('inc-type').value, monthly_amount: amount, active: true });
    closeAllModals();
    document.getElementById('inc-name').value = '';
    document.getElementById('inc-amount').value = '';
    showToast('เพิ่มรายได้แล้ว ✅');
    loadIncomeSources();
  } catch (e) {
    showToast('เกิดข้อผิดพลาด ลองใหม่');
  }
  btn.disabled = false; btn.textContent = 'บันทึก';
}

// ── Modals ────────────────────────────────────────────────────

function openModal(name) {
  document.getElementById('modal-' + name)?.classList.remove('hidden');
}

function closeAllModals() {
  document.querySelectorAll('.modal-sheet').forEach(m => m.classList.add('hidden'));
}

// Close modal on backdrop click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-sheet')) closeAllModals();
});

// ── API Test ──────────────────────────────────────────────────

async function testApi() {
  const btn = document.getElementById('test-btn');
  btn.textContent = '...';
  btn.disabled = true;
  try {
    const t0 = Date.now();
    await API.getSettings();
    const ms = Date.now() - t0;
    btn.textContent = `✅ ${ms}ms`;
    btn.style.color = '#16a34a';
    btn.style.background = '#dcfce7';
  } catch (e) {
    btn.textContent = '❌ Error';
    btn.style.color = '#dc2626';
    btn.style.background = '#fee2e2';
  }
  btn.disabled = false;
  setTimeout(() => {
    btn.textContent = 'ทดสอบ';
    btn.style.color = '';
    btn.style.background = '';
  }, 3000);
}

// ── Cache ─────────────────────────────────────────────────────

function clearCache() {
  const keep = ['lang', 'theme', 'profileName'];
  const saved = {};
  keep.forEach(k => { saved[k] = localStorage.getItem(k); });
  localStorage.clear();
  keep.forEach(k => { if (saved[k]) localStorage.setItem(k, saved[k]); });
  showToast('ล้าง Cache แล้ว ✅');
}

// ── Thai Tax Calculator ───────────────────────────────────────

function calcTax() {
  const income = parseFloat(document.getElementById('tax-income').value) || 0;
  if (income <= 0) {
    document.getElementById('tax-result').classList.add('hidden');
    return;
  }

  const lifeIns = Math.min(parseFloat(document.getElementById('tax-life-ins').value) || 0, 100000);
  const fund = parseFloat(document.getElementById('tax-fund').value) || 0;
  const maxFund = income * 0.30;

  // Standard deductions
  const empDeduction = Math.min(income * 0.50, 100000);
  const personalAllowance = 60000;
  const socialSecurity = 9000;
  const lifeInsDeduction = lifeIns;
  const fundDeduction = Math.min(fund, maxFund, 500000);

  const totalDeductions = empDeduction + personalAllowance + socialSecurity + lifeInsDeduction + fundDeduction;
  const netIncome = income - empDeduction;
  const taxableIncome = Math.max(0, income - totalDeductions);

  // Thai progressive tax rates 2025
  const brackets = [
    { limit: 150000,  rate: 0.00 },
    { limit: 300000,  rate: 0.05 },
    { limit: 500000,  rate: 0.10 },
    { limit: 750000,  rate: 0.15 },
    { limit: 1000000, rate: 0.20 },
    { limit: 2000000, rate: 0.25 },
    { limit: 5000000, rate: 0.30 },
    { limit: Infinity, rate: 0.35 }
  ];

  let tax = 0;
  let prev = 0;
  for (const b of brackets) {
    if (taxableIncome <= prev) break;
    const chunk = Math.min(taxableIncome - prev, b.limit - prev);
    tax += chunk * b.rate;
    prev = b.limit;
  }

  document.getElementById('tr-net').textContent = formatMoney(netIncome);
  document.getElementById('tr-allow').textContent = formatMoney(totalDeductions - empDeduction);
  document.getElementById('tr-taxable').textContent = formatMoney(taxableIncome);
  document.getElementById('tr-tax').textContent = formatMoney(tax);
  document.getElementById('tr-monthly').textContent = formatMoney(tax / 12) + '/เดือน';
  document.getElementById('tax-result').classList.remove('hidden');
}

// ── Toast ─────────────────────────────────────────────────────

function showToast(msg) {
  const old = document.getElementById('toast');
  if (old) old.remove();
  const t = document.createElement('div');
  t.id = 'toast';
  t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1e293b;color:white;font-size:0.85rem;padding:0.6rem 1.25rem;border-radius:99px;z-index:100;box-shadow:0 4px 12px rgba(0,0,0,0.2);white-space:nowrap';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}
