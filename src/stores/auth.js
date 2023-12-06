import { ref } from 'vue';
import { defineStore } from 'pinia';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

import { app } from '@/config/firebase';

const auth = getAuth(app);
auth.useDeviceLanguage();

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const status = ref('pending');
  const unsubFn = ref(null);

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

  return {
    user,
    status,
    setUser,
    setStatus,
    registerAuthListener,
    deRegisterAuthListener
  };
});
