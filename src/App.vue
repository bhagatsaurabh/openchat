<script setup>
import { onBeforeMount, onBeforeUnmount } from 'vue';

import MediaObserver from '@/components/MediaObserver/MediaObserver.vue';
import { usePreferencesStore } from '@/stores/preferences';
import { useAuthStore } from '@/stores/auth';
import { openDB } from '@/database/database';
import { registerPersistence } from '@/database/driver';

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
</template>

<style scoped>
/*  */
</style>
./database/database./database/driver
