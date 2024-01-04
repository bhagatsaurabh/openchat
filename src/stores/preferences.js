import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

import { themeClasses, themes } from '../utils/constants';
import * as local from '../database/driver';

export const usePreferencesStore = defineStore('preferences', () => {
  const userTheme = ref(themes.SYSTEM);
  const systemTheme = ref(currSystemTheme());
  const theme = computed(() => (userTheme.value === themes.SYSTEM ? systemTheme.value : userTheme.value));

  const serializableState = computed(() => ({
    theme: userTheme.value
  }));

  function currSystemTheme() {
    if (window.matchMedia('(prefers-contrast: more)').matches) {
      return themes.HIGH_CONTRAST;
    }
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return themes.DARK;
    }
    return themes.LIGHT;
  }
  function getThemeClass(inTheme) {
    inTheme = inTheme ?? userTheme.value;
    return themeClasses[inTheme === themes.SYSTEM ? currSystemTheme() : inTheme];
  }
  function sanitizePrefs(prefs = {}) {
    prefs.theme = Object.values(themes).includes(prefs.theme) ? prefs.theme : themes.SYSTEM;
  }
  async function load() {
    try {
      const storedPreferences = await local.getPreferences();
      sanitizePrefs(storedPreferences);

      setTheme(storedPreferences.theme);
    } catch (error) {
      // notify
    }
  }
  function setTheme(newTheme) {
    if (!Object.values(themes).includes(newTheme)) {
      return false;
    }

    const themeClass = getThemeClass(newTheme === themes.SYSTEM ? currSystemTheme() : newTheme);

    const docRoot = document.documentElement;
    docRoot.dataset.theme = themeClass;
    if (newTheme === themes.SYSTEM) {
      docRoot.className = themeClass;
      systemTheme.value = currSystemTheme();
    } else {
      if (docRoot.className === '') {
        docRoot.classList.add(themeClass);
      } else {
        docRoot.classList.replace(getThemeClass(), themeClass);
      }
    }

    userTheme.value = newTheme;
  }

  return {
    userTheme,
    systemTheme,
    theme,
    currSystemTheme,
    serializableState,
    load,
    setTheme
  };
});
