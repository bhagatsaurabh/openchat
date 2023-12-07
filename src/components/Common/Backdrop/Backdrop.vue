<script setup>
defineProps({
  show: {
    type: Boolean,
    default: false
  },
  clear: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['dismiss']);
</script>

<template>
  <Transition name="fade">
    <div @pointerup="emit('dismiss')" v-if="show" class="backdrop" :class="{ clear }"></div>
  </Transition>
</template>

<style scoped>
.backdrop {
  position: fixed;
  z-index: 100;
  background-color: #0000001c;
  width: 100vw;
  height: 100vh;
  top: 0;
  left: 0;
  backdrop-filter: blur(3px);
}
.backdrop.clear {
  backdrop-filter: unset;
  background-color: unset;
}
</style>
