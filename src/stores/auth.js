import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const status = ref(null);

  function setUser(signedInUser) {
    user.value = signedInUser;
  }
  function setStatus(inStatus) {
    status.value = inStatus;
  }

  return {
    user,
    status,
    setUser,
    setStatus
  };
});
