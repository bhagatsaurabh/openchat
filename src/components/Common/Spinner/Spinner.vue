<script setup>
import { computed } from 'vue';

const props = defineProps({
  size: {
    type: Number,
    default: 1
  },
  blobCount: {
    type: Number,
    default: 3
  },
  invert: {
    type: Boolean,
    default: false
  }
});

const colors = ['#c591df', '#ac56d7', '#bd7bde', '#e4adff'];
const gap = computed(() => props.size / 4);

const getTint = (i) => colors[(i - 1) % 4];
</script>

<template>
  <span class="spinner" :style="{ gap: `${gap}rem` }">
    <div
      v-for="i in blobCount"
      :key="i"
      class="blob"
      :style="{
        width: `${size}rem`,
        height: `${size}rem`,
        animationDelay: `${i * 0.2}s`,
        backgroundColor: getTint(i)
      }"
    ></div>
  </span>
</template>

<style scoped>
@keyframes scale-in-out {
  0% {
    transform: scale(0);
  }
  45% {
    transform: scale(1);
  }
  55% {
    transform: scale(1);
  }
  100% {
    transform: scale(0);
  }
}

.spinner {
  display: flex;
}
.spinner .blob {
  background-color: #e4adff;
  border-radius: 100%;
  transform: scale(0);
  transform-origin: center;
  animation: scale-in-out 1.25s ease-out 0s infinite forwards normal;
}
</style>
