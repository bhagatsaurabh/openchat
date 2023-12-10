import { ref } from 'vue';
import { defineStore } from 'pinia';
import { getAuth, onAuthStateChanged, signInWithPhoneNumber, signInAnonymously } from 'firebase/auth';

import { app } from '@/config/firebase';
import { useNotificationStore } from './notification';
import { useRecaptchaStore } from './recaptcha';

const auth = getAuth(app);
auth.useDeviceLanguage();

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const status = ref('pending');
  const unsubFn = ref(null);

  const captcha = useRecaptchaStore();
  const notify = useNotificationStore();

  function setUser(signedInUser) {
    user.value = signedInUser;
  }
  function setStatus(inStatus) {
    status.value = inStatus;
  }
  function registerAuthListener() {
    if (unsubFn.value) return;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        setStatus('signedin');
      } else {
        setStatus('signedout');
      }
    });
    unsubFn.value = unsubscribe;
  }
  function deRegisterAuthListener() {
    unsubFn.value();
  }
  async function signIn(type, options) {
    if (type === 'phone') {
      const { countryCode, phoneNum } = options;
      try {
        window.phoneConfirmation = await signInWithPhoneNumber(
          auth,
          `+${countryCode}${phoneNum}`,
          window.verifier
        );
      } catch (error) {
        window.grecaptcha.reset(captcha.widgetId);
        throw error;
      }
    } else if (type === 'phone-verify') {
      const { code } = options;
      const result = await window.phoneConfirmation?.confirm(code);
      setUser(result.user);
    } else if (type === 'guest') {
      try {
        const result = await signInAnonymously(auth);
        setUser(result.user);
      } catch (error) {
        console.log(error);
        notify.push({ type: 'snackbar', status: 'warn', message: 'Something went wrong, please try again' });
      }
    }
  }
  async function signOut() {
    try {
      await auth.signOut();
      user.value = null;
    } catch (error) {
      console.log(error);
      notify.push({ type: 'snackbar', status: 'warn', message: 'Something went wrong, please try again' });
    }
  }

  return {
    user,
    status,
    setUser,
    setStatus,
    registerAuthListener,
    deRegisterAuthListener,
    signIn,
    signOut
  };
});
