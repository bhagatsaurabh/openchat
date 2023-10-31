import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { themeClasses, themes } from '../utils/constants';

export const usePreferencesStore = defineStore('preferences', () => {
  const userTheme = ref(themes.SYSTEM);
  const systemTheme = ref(themes.LIGHT);

  const theme = computed(() => (userTheme.value === themes.SYSTEM ? currSystemTheme.value : userTheme.value));
  const currSystemTheme = computed(() => {
    if (window.matchMedia('(prefers-contrast: more)').matches) {
      return themes.HIGH_CONTRAST;
    }
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return themes.DARK;
    }
    return themes.LIGHT;
  });
  const serializableState = computed(() => ({
    theme: userTheme.value
  }));

  function getThemeClass(inTheme) {
    inTheme = inTheme ?? userTheme.value;
    return themeClasses[inTheme === themes.SYSTEM ? currSystemTheme.value : inTheme];
  }
  function sanitizePrefs(prefs = {}) {
    prefs.theme = Object.values(themes).includes(prefs.theme) ? prefs.theme : themes.SYSTEM;
  }
  function update() {
    const serialized = JSON.stringify(serializableState);
    // TODO: save user-prefs in indexed-db...
    return serialized;
  }
  async function load() {
    const storedPreferences = JSON.parse(/* TODO: Fetch saved user-prefs from indexed-db... */);
    sanitizePrefs(storedPreferences);

    setTheme(storedPreferences.theme);
  }
  function setTheme(newTheme) {
    if (!Object.values(themes).includes(newTheme)) {
      return false;
    }

    const themeClass = getThemeClass(newTheme === themes.SYSTEM ? currSystemTheme.value : newTheme);

    const docRoot = document.documentElement;
    docRoot.dataset.theme = themeClass;
    if (newTheme === themes.SYSTEM) {
      docRoot.className = themeClass;
      systemTheme.value = currSystemTheme.value;
    } else {
      if (docRoot.className === '') {
        docRoot.classList.add(themeClass);
      } else {
        docRoot.classList.replace(getThemeClass(), themeClass);
      }
    }

    userTheme.value = newTheme;
    update();
  }

  return {
    userTheme,
    systemTheme,
    theme,
    currSystemTheme,
    serializableState,
    update,
    load,
    setTheme
  };
});
