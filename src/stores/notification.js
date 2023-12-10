import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useNotificationStore = defineStore('notification', () => {
  const active = ref(null);
  const notifications = ref([]);

  function push(notification) {
    active.value = notification;
    notifications.value.push(notification);
  }

  return {
    notifications,
    active,
    push
  };
});
