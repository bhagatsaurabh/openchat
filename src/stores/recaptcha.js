import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useRecaptchaStore = defineStore('recaptcha', () => {
  const active = ref(null);
  const defaultId = ref(null);
  const ready = ref(false);
  const errormsg = ref(null);
  const widgetId = ref(null);

  return {
    active,
    defaultId,
    ready,
    errormsg,
    widgetId
  };
});
