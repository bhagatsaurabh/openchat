<script setup>
import { ref, watch } from 'vue';

import Icon from '@/components/Common/Icon/Icon.vue';
import Button from '@/components/Common/Button/Button.vue';

const props = defineProps({
  data: Object
});
const emit = defineEmits(['dismiss', 'action']);

const notification = ref(props.data);
const el = ref(null);

const handleDismiss = (e) => {
  if (notification.value && e.animationName === 'shrink' && e.target === el.value) notification.value = null;
};

watch(
  () => props.data,
  () => {
    if (props.data) {
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
  <Transition name="slide" appear @after-leave="emit('dismiss')">
    <div v-if="notification" ref="el" class="snackbar" @animationend="handleDismiss">
      <Icon :size="1.5" class="icon" :alt="notification.status" :name="notification.status" singular />
      <span class="message">{{ notification.message }}</span>
      <Button @click="emit('action')" v-if="notification.action">{{ notification.action }}</Button>
      <Button icon="close" @click="notification = null" :complementary="false" circular />
    </div>
  </Transition>
</template>

<style scoped>
.snackbar {
  transform-origin: bottom;
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100vw;
  z-index: 100;
  padding: 1rem;
  display: flex;
  align-items: center;
  box-shadow: 0 0 10px 0 var(--c-shadow-0);
  background-color: var(--c-background-2);
  font-size: 1rem;
}

.snackbar .icon {
  font-size: 0;
  margin-right: 0.5rem;
}
.snackbar .message {
  margin-right: 0.5rem;
  flex: 1;
}

.snackbar::after {
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
