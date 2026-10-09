(() => {
  const storageKey = 'xw-theme';
  const root = document.documentElement;
  const toggle = document.querySelector('[data-theme-toggle]');
  const label = document.querySelector('[data-theme-label]');
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const systemTheme = window.matchMedia('(prefers-color-scheme: light)');

  function applyTheme(theme, persist = false) {
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    if (persist) {
      try { localStorage.setItem(storageKey, theme); } catch { /* Preference remains active for this page. */ }
    }

    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    if (label) label.textContent = theme === 'light' ? 'Light' : 'Dark';
    if (toggle) toggle.setAttribute('aria-label', `Switch to ${nextTheme} theme`);
    if (themeColor) themeColor.content = theme === 'dark' ? '#080d19' : '#f5f7fb';
  }

  applyTheme(root.dataset.theme || (systemTheme.matches ? 'light' : 'dark'));

  toggle?.addEventListener('click', () => {
    applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true);
  });

  systemTheme.addEventListener('change', (event) => {
    let hasSavedTheme = false;
    try { hasSavedTheme = Boolean(localStorage.getItem(storageKey)); } catch { /* Follow the system theme. */ }
    if (!hasSavedTheme) applyTheme(event.matches ? 'light' : 'dark');
  });
})();
