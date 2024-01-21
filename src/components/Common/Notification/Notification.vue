<script setup>
import { computed } from 'vue';

import { useNotificationStore } from '@/stores/notification';
import Snackbar from '@/components/Common/Snackbar/Snackbar.vue';
import Banner from '@/components/Common/Banner/Banner.vue';

const notifyStore = useNotificationStore();
const notifyComponent = computed(() => (notifyStore.active?.type === 'snackbar' ? Snackbar : Banner));

const handleDismiss = () => {
  notifyStore.active = null;
};
</script>

<template>
  <div class="notification" :class="{ active: notifyStore.active }">
    <component
      v-if="notifyStore.active"
      @action="() => notifyStore.active?.onAction()"
      @dismiss="handleDismiss"
      :is="notifyComponent"
      :data="notifyStore.active"
    />
  </div>
</template>

<style scoped></style>
