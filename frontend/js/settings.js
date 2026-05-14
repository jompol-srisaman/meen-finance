// settings.js

document.addEventListener('DOMContentLoaded', () => {
  loadProfileName();
  applyLangButtons();
  applyTheme();
});

// ── Profile Name ──────────────────────────────────────────────

function loadProfileName() {
  const name = localStorage.getItem('profileName') || 'Meen Finance';
  document.getElementById('profile-name').textContent = name;
  document.querySelector('#profile-name').closest('.flex').querySelector('.w-10').textContent = name.charAt(0).toUpperCase();
}

function editName() {
  document.getElementById('new-name').value = localStorage.getItem('profileName') || '';
  document.getElementById('name-modal').classList.remove('hidden');
  setTimeout(() => document.getElementById('new-name').focus(), 100);
}

function saveName() {
  const name = document.getElementById('new-name').value.trim();
  if (!name) return;
  localStorage.setItem('profileName', name);
  document.getElementById('name-modal').classList.add('hidden');
  loadProfileName();
}

// ── Language ──────────────────────────────────────────────────

function applyLangButtons() {
  const lang = localStorage.getItem('lang') || 'th';
  if (lang === 'th') {
    document.getElementById('lang-th').className = 'px-3 py-1.5 text-sm font-medium bg-blue-500 text-white';
    document.getElementById('lang-en').className = 'px-3 py-1.5 text-sm font-medium bg-white text-gray-500';
    document.getElementById('lang-sub').textContent = 'ไทย / Thai';
  } else {
    document.getElementById('lang-en').className = 'px-3 py-1.5 text-sm font-medium bg-blue-500 text-white';
    document.getElementById('lang-th').className = 'px-3 py-1.5 text-sm font-medium bg-white text-gray-500';
    document.getElementById('lang-sub').textContent = 'English';
  }
}

function setLang(lang) {
  localStorage.setItem('lang', lang);
  applyLangButtons();
}

// ── Theme ─────────────────────────────────────────────────────

function applyTheme() {
  const dark = localStorage.getItem('theme') === 'dark';
  const toggle = document.getElementById('theme-toggle');
  const knob = document.getElementById('theme-knob');
  const sub = document.getElementById('theme-sub');
  if (dark) {
    toggle.classList.replace('bg-gray-300', 'bg-blue-500');
    knob.style.transform = 'translateX(24px)';
    sub.textContent = 'มืด (Dark)';
    document.body.classList.add('dark-mode');
  } else {
    toggle.classList.replace('bg-blue-500', 'bg-gray-300');
    knob.style.transform = 'translateX(0)';
    sub.textContent = 'สว่าง (Light)';
    document.body.classList.remove('dark-mode');
  }
}

function toggleTheme() {
  const dark = localStorage.getItem('theme') === 'dark';
  localStorage.setItem('theme', dark ? 'light' : 'dark');
  applyTheme();
}

// ── API Test ──────────────────────────────────────────────────

async function testApi() {
  const btn = document.getElementById('test-btn');
  btn.textContent = 'กำลังทดสอบ...';
  btn.disabled = true;
  try {
    const start = Date.now();
    const data = await API.getSettings();
    const ms = Date.now() - start;
    btn.textContent = `✅ OK (${ms}ms)`;
    btn.className = 'text-green-500 text-sm font-medium';
    setTimeout(() => {
      btn.textContent = 'ทดสอบ';
      btn.className = 'text-blue-500 text-sm font-medium';
      btn.disabled = false;
    }, 3000);
  } catch (e) {
    btn.textContent = '❌ ไม่ได้';
    btn.className = 'text-red-500 text-sm font-medium';
    btn.disabled = false;
  }
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

// ── Category Modal ────────────────────────────────────────────

function openCategoryModal() {
  document.getElementById('category-modal').classList.remove('hidden');
  setTimeout(() => document.getElementById('cat-name').focus(), 100);
}

function closeCategoryModal() {
  document.getElementById('category-modal').classList.add('hidden');
}

async function saveCategory() {
  const name = document.getElementById('cat-name').value.trim();
  const budget = parseFloat(document.getElementById('cat-budget').value);
  if (!name || !budget) { showToast('กรุณากรอกข้อมูลให้ครบ'); return; }
  try {
    await API.addExpenseCategory({
      name,
      type: document.getElementById('cat-type').value,
      monthly_budget: budget
    });
    closeCategoryModal();
    document.getElementById('cat-name').value = '';
    document.getElementById('cat-budget').value = '';
    showToast('เพิ่มหมวดหมู่แล้ว ✅');
  } catch (e) {
    showToast('เกิดข้อผิดพลาด ลองใหม่');
  }
}

// ── Toast ─────────────────────────────────────────────────────

function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-sm px-5 py-2.5 rounded-full z-50 shadow-lg';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}
