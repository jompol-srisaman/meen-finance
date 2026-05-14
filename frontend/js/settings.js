// settings.js

document.addEventListener('DOMContentLoaded', () => {
  loadProfileName();
  applyLangButtons();
  highlightTheme(localStorage.getItem('theme') || 'sky');
});

// ── Profile ───────────────────────────────────────────────────

function loadProfileName() {
  const name = localStorage.getItem('profileName') || 'Meen Finance';
  document.getElementById('profile-name').textContent = name;
  document.getElementById('avatar').textContent = name.charAt(0).toUpperCase();
}

function editName() {
  document.getElementById('new-name').value = localStorage.getItem('profileName') || '';
  document.getElementById('name-modal').classList.remove('hidden');
  setTimeout(() => document.getElementById('new-name').focus(), 150);
}

function saveName() {
  const name = document.getElementById('new-name').value.trim();
  if (!name) return;
  localStorage.setItem('profileName', name);
  document.getElementById('name-modal').classList.add('hidden');
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

// ── Category Modal ────────────────────────────────────────────

function openCategoryModal() {
  document.getElementById('category-modal').classList.remove('hidden');
  setTimeout(() => document.getElementById('cat-name').focus(), 150);
}

function closeCategoryModal() {
  document.getElementById('category-modal').classList.add('hidden');
}

async function saveCategory() {
  const name = document.getElementById('cat-name').value.trim();
  const budget = parseFloat(document.getElementById('cat-budget').value);
  if (!name || !budget) { showToast('กรุณากรอกข้อมูลให้ครบ'); return; }
  try {
    await API.addExpenseCategory({ name, type: document.getElementById('cat-type').value, monthly_budget: budget });
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
  const old = document.getElementById('toast');
  if (old) old.remove();
  const t = document.createElement('div');
  t.id = 'toast';
  t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1e293b;color:white;font-size:0.85rem;padding:0.6rem 1.25rem;border-radius:99px;z-index:100;box-shadow:0 4px 12px rgba(0,0,0,0.2);white-space:nowrap';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}
