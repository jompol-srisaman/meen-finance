// theme.js — Apply theme before page renders (load in <head>)
(function () {
  const t = localStorage.getItem('theme') || 'sky';
  document.documentElement.setAttribute('data-theme', t);
})();
