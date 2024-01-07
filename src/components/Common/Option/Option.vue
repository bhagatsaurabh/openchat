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
    <Icon class="icon" v-if="data.icon" :name="data.icon" :alt="data.icon" singular />
    <span class="text">{{ data.text }}</span>
  </div>
</template>

<style scoped>
.option {
  padding: 0.75rem;
  transition: background-color var(--fx-transition-duration-0) linear;
  display: flex;
  align-items: center;
}
.option.active {
  background-color: var(--c-background-3);
}
.option .icon {
  font-size: 0;
  margin-right: 0.5rem;
}
.option .icon:deep(img) {
  filter: invert(51%) sepia(3%) saturate(99%) hue-rotate(20deg) brightness(90%) contrast(88%);
}
.option .text {
}

@media (hover: hover) {
  .option:hover {
    background-color: var(--c-background-3);
  }
}
</style>
