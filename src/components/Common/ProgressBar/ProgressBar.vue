<script setup>
import { computed } from 'vue';

import { clamp } from '@/utils/utils';

const props = defineProps({
  value: Number,
  indefinite: {
    type: Boolean,
    default: false
  }
});

const progress = computed(() => Math.round(clamp(props.value, [0, 100])));
const background = computed(
  () => `radial-gradient(closest-side, transparent 79%, transparent 80% 100%),
    conic-gradient(var(--c-accent) ${progress.value}%, var(--c-accent-light-2) 0)`
);
</script>

<template>
  <Transition name="fade" :duration="250" mode="out-in" appear>
    <div :key="0" v-if="!indefinite" class="progress-bar" :style="{ background }">
      <progress
        :value="progress"
        min="0"
        max="100"
        style="visibility: hidden; height: 0; width: 0"
      ></progress>
    </div>
    <div v-else>
      <img class="progress-bar-indefinite" src="/assets/images/indefinite-progress.svg" />
    </div>
  </Transition>
</template>

<style scoped>
.progress-bar-indefinite,
.progress-bar {
  width: 100%;
  height: 100%;
}
.progress-bar {
  border-radius: 50%;
  background: radial-gradient(closest-side, transparent 79%, transparent 80% 100%),
    conic-gradient(var(--c-accent) 75%, var(--c-accent-light-2) 0);
  mask-image: radial-gradient(circle farthest-side at center, transparent 85%, white 86%);
}
</style>
