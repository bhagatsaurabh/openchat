<script setup>
import { onBeforeUnmount } from 'vue';

import { usePreferencesStore } from '@/stores/preferences';
import { themes } from '@/utils/constants';

const preferences = usePreferencesStore();

const mediaChangeHandler = async (e) => {
  if (e.matches && preferences.userTheme === themes.SYSTEM) {
    preferences.setTheme(themes.SYSTEM);
  }
};
const mediaHighCntrst = window.matchMedia('(prefers-contrast: more)');
mediaHighCntrst.addEventListener('change', mediaChangeHandler);
const mediaDark = window.matchMedia('(prefers-color-scheme: dark)');
mediaDark.addEventListener('change', mediaChangeHandler);
const mediaLight = window.matchMedia('(prefers-color-scheme: light)');
mediaLight.addEventListener('change', mediaChangeHandler);

onBeforeUnmount(() => {
  mediaHighCntrst.removeEventListener('change', mediaChangeHandler);
  mediaDark.removeEventListener('change', mediaChangeHandler);
  mediaLight.removeEventListener('change', mediaChangeHandler);
});
</script>
