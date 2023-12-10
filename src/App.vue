<script setup>
import { onBeforeMount, onBeforeUnmount } from 'vue';

import { usePreferencesStore } from '@/stores/preferences';
import { useAuthStore } from '@/stores/auth';
import { openDB } from '@/database/database';
import { registerPersistence } from '@/database/driver';
import MediaObserver from '@/components/MediaObserver/MediaObserver.vue';
import Recaptcha from '@/components/Recaptcha/Recaptcha.vue';
import Notification from '@/components/Common/Notification/Notification.vue';

const preferences = usePreferencesStore();
const auth = useAuthStore();

onBeforeMount(async () => {
  try {
    await openDB();
    await preferences.load();
    registerPersistence();
  } catch (error) {
    // TODO: error-handling
  }
});

onBeforeUnmount(() => {
  auth.deRegisterAuthListener();
});
</script>

<template>
  <MediaObserver />
  <RouterView />
  <Recaptcha default />
  <Notification />
</template>

<style scoped>
/*  */
</style>
