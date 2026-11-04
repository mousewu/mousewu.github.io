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

(() => {
  const storageKey = 'xw-language';
  const root = document.documentElement;
  const toggle = document.querySelector('[data-language-toggle]');
  const label = toggle?.querySelector('[data-language-label]');
  const page = document.body;
  const description = document.querySelector('meta[name="description"]');

  function applyLanguage(language, persist = false) {
    const next = language === 'zh' ? 'zh' : 'en';
    root.dataset.lang = next;
    root.lang = next === 'zh' ? 'zh-CN' : 'en';
    const pageTitle = next === 'zh' ? page?.dataset.pageTitleZh : page?.dataset.pageTitleEn;
    const pageDescription = next === 'zh' ? page?.dataset.pageDescriptionZh : page?.dataset.pageDescriptionEn;
    if (pageTitle) document.title = `${pageTitle} · Xianyue Wu`;
    if (description && pageDescription) description.content = pageDescription;

    if (persist) {
      try { localStorage.setItem(storageKey, next); } catch { /* Preference remains active for this page. */ }
    }

    if (toggle && label) {
      const switchToChinese = next === 'en';
      label.textContent = switchToChinese ? '中' : 'EN';
      const accessibleLabel = switchToChinese ? '切换为中文' : 'Switch to English';
      toggle.setAttribute('aria-label', accessibleLabel);
      toggle.setAttribute('title', accessibleLabel);
      toggle.setAttribute('aria-pressed', String(next === 'zh'));
    }
  }

  applyLanguage(root.dataset.lang);
  toggle?.addEventListener('click', () => {
    applyLanguage(root.dataset.lang === 'zh' ? 'en' : 'zh', true);
  });
})();
