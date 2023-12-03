<script setup>
import { onBeforeMount } from 'vue';

import MediaObserver from '@/components/MediaObserver/MediaObserver.vue';
import { usePreferencesStore } from '@/stores/preferences';
import { openDB } from '@/database/database';
import { registerPersistence } from '@/database/driver';

const preferences = usePreferencesStore();

onBeforeMount(async () => {
  try {
    await openDB();
    await preferences.load();
    registerPersistence();
  } catch (error) {
    // TODO: error-handling
  }
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
