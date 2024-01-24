<script setup>
import Button from '@/components/Common/Button/Button.vue';

const props = defineProps({
  size: {
    type: Number,
    default: 1
  },
  icon: String,
  modelValue: Boolean
});

const emit = defineEmits(['update:modelValue', 'change']);

const handleClick = () => {
  emit('update:modelValue', !props.modelValue);
  emit('change', !props.modelValue);
}
</script>

<template>
  <Button
    @click="handleClick"
    class="toggle"
    :class="{ active: modelValue }"
    :icon="icon"
    :size="size"
    :complementary="false"
    circular
    flat
  />
</template>

<style scoped>
.toggle.active {
  background-color: var(--c-accent-light-3);
}
</style>
