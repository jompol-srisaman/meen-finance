// nav.js — Shared hamburger drawer (auto-injected on all pages)

(function () {
  const NAV_PAGES = [
    { href: 'index.html',        icon: 'fa-home',          label: 'หน้าหลัก',           group: 'main' },
    { href: 'transactions.html', icon: 'fa-list',          label: 'รายการรับ-จ่าย',      group: 'main' },
    { href: 'assets.html',       icon: 'fa-wallet',        label: 'ทรัพย์สิน & หนี้สิน', group: 'main' },
    { href: 'insurance.html',    icon: 'fa-shield-halved', label: 'ประกันภัย',           group: 'main' },
    { href: 'goals.html',        icon: 'fa-bullseye',      label: 'เป้าหมาย',            group: 'tools' },
    { href: 'cashflow.html',     icon: 'fa-chart-pie',     label: 'Cashflow Statement',  group: 'tools' },
    { href: 'tax.html',          icon: 'fa-calculator',    label: 'คำนวณภาษี',           group: 'tools' },
    { href: 'settings.html',     icon: 'fa-cog',           label: 'ตั้งค่า',             group: 'system' },
  ];

  const GROUP_LABELS = { main: 'เมนูหลัก', tools: 'เครื่องมือ', system: 'ระบบ' };

  function buildDrawer() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const userName = localStorage.getItem('profileName') || 'Meen Finance';
    const initial = userName.charAt(0).toUpperCase();

    let links = '';
    ['main', 'tools', 'system'].forEach(grp => {
      const pages = NAV_PAGES.filter(p => p.group === grp);
      links += `<p class="drawer-group-label">${GROUP_LABELS[grp]}</p>`;
      pages.forEach(p => {
        const active = p.href === currentPage;
        links += `
          <a href="${p.href}" onclick="closeDrawer()" class="drawer-link ${active ? 'drawer-link-active' : ''}">
            <i class="fas ${p.icon} drawer-link-icon"></i>
            <span>${p.label}</span>
            ${active ? '<i class="fas fa-circle" style="margin-left:auto;font-size:5px"></i>' : ''}
          </a>`;
      });
    });

    return `
      <div id="drawer-overlay" onclick="closeDrawer()" style="position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:70;display:none;backdrop-filter:blur(2px)"></div>
      <aside id="drawer" style="position:fixed;top:0;left:0;height:100%;width:280px;z-index:80;transform:translateX(-100%);transition:transform .28s cubic-bezier(.4,0,.2,1);display:flex;flex-direction:column;background:var(--card);box-shadow:4px 0 24px rgba(0,0,0,.15)">
        <div style="padding:3rem 1.25rem 1.25rem;background:linear-gradient(135deg,var(--header-from),var(--header-to));flex-shrink:0">
          <div style="width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,.25);display:flex;align-items:center;justify-content:center;font-size:1.375rem;font-weight:700;color:white;margin-bottom:.75rem">${initial}</div>
          <p style="color:white;font-weight:700;font-size:1rem;margin:0">${userName}</p>
          <p style="color:rgba(255,255,255,.6);font-size:.72rem;margin:.1rem 0 0">Personal Finance Tracker</p>
        </div>
        <nav style="flex:1;overflow-y:auto;padding:.5rem 0">${links}</nav>
        <div style="padding:.75rem 1.25rem;border-top:1px solid var(--divider);font-size:.7rem;color:var(--text-sub)">Meen Finance v2.0</div>
      </aside>`;
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.body.insertAdjacentHTML('beforeend', buildDrawer());
  });

  window.openDrawer = function () {
    document.getElementById('drawer').style.transform = 'translateX(0)';
    document.getElementById('drawer-overlay').style.display = 'block';
  };

  window.closeDrawer = function () {
    document.getElementById('drawer').style.transform = 'translateX(-100%)';
    document.getElementById('drawer-overlay').style.display = 'none';
  };
})();
