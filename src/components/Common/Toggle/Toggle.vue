<script setup>
import Button from '@/components/Common/Button/Button.vue';

defineProps({
  size: {
    type: Number,
    default: 1
  },
  modelValue: Boolean
});

const emit = defineEmits(['update:modelValue']);
</script>

<template>
  <Button
    @click="emit('update:modelValue', !modelValue)"
    class="toggle"
    :class="{ active: modelValue }"
    icon="unread"
    :size="size"
    :complementary="false"
    circular
    flat
  />
</template>

<style scoped>
.toggle {
}
.toggle.active {
  background-color: var(--c-accent-light-3)
}
</style>
