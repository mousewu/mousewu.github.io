(() => {
  const storageKey = 'xw-theme';
  const root = document.documentElement;
  const options = document.querySelectorAll('[data-theme-option]');
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const systemTheme = window.matchMedia('(prefers-color-scheme: light)');

  function applyTheme(theme, persist = false) {
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    if (persist) {
      try { localStorage.setItem(storageKey, theme); } catch { /* Preference remains active for this page. */ }
    }

    options.forEach((option) => {
      option.setAttribute('aria-pressed', String(option.dataset.themeOption === theme));
    });
    if (themeColor) themeColor.content = theme === 'dark' ? '#080d19' : '#f5f7fb';
  }

  applyTheme(root.dataset.theme || (systemTheme.matches ? 'light' : 'dark'));

  options.forEach((option) => {
    option.addEventListener('click', () => applyTheme(option.dataset.themeOption, true));
  });

  systemTheme.addEventListener('change', (event) => {
    let hasSavedTheme = false;
    try { hasSavedTheme = Boolean(localStorage.getItem(storageKey)); } catch { /* Follow the system theme. */ }
    if (!hasSavedTheme) applyTheme(event.matches ? 'light' : 'dark');
  });
})();
