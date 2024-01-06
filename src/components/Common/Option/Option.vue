<script setup>
import Icon from '../Icon/Icon.vue';

const props = defineProps({
  data: Object,
  active: {
    type: Boolean,
    default: false
  }
});
const emit = defineEmits(['select']);
</script>

<template>
  <div
    @pointerdown="(e) => e.stopPropagation()"
    @click="emit('select', props.data)"
    class="option"
    :class="{ active }"
  >
    <Icon v-if="data.icon" :name="data.icon" :alt="data.icon" singular />
    <span class="text">{{ data.text }}</span>
  </div>
</template>

<style scoped>
.option {
  padding: 0.75rem;
  transition: background-color var(--fx-transition-duration-0) linear;
}
.option.active {
  background-color: var(--c-background-3);
}
.option .text {
}

@media (hover: hover) {
  .option:hover {
    background-color: var(--c-background-3);
  }
}
</style>
