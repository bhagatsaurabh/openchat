<script setup>
import { computed, ref, watch } from 'vue';

import { useNotificationStore } from '@/stores/notification';
import Snackbar from '@/components/Common/Snackbar/Snackbar.vue';
import Banner from '@/components/Common/Banner/Banner.vue';

const notifyStore = useNotificationStore();
const timerHandle = ref(-1);
const el = ref(null);
const notifyComponent = computed(() => (notifyStore.active?.type === 'snackbar' ? Snackbar : Banner));

const handleDismiss = () => {
  notifyStore.active = null;
};

const handleAnimEnd = (e) => {
  if (e.animationName === 'shrink' && e.target === el.value) handleDismiss();
};

watch(
  () => notifyStore.active,
  () => {
    if (notifyStore.active) {
      const animation = document
        .getAnimations()
        .find((anim) => anim.animationName === 'shrink' && anim.effect.target === el.value);
      animation?.cancel();
      animation?.play();
    }
  }
);
</script>

<template>
  <div ref="el" class="notification" :class="{ active: notifyStore.active }" @animationend="handleAnimEnd">
    <component
      @action="() => notifyStore.active?.onAction()"
      @dismiss="handleDismiss"
      :is="notifyComponent"
      :data="notifyStore.active"
    />
  </div>
</template>

<style scoped>
.notification.active::after {
  content: '';
  display: block;
  position: absolute;
  bottom: 0;
  height: 4px;
  left: 0;
  width: 100%;
  background-color: var(--c-accent);
  z-index: 100;
  animation: shrink 5s linear 0s 1 normal forwards;
}
</style>
