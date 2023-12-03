<script setup>
import Icon from '../Icon/Icon.vue';

defineProps({
  size: {
    type: Number,
    default: 1
  },
  invert: {
    type: Boolean,
    default: false
  }
});
</script>

<template>
  <Icon class="spinner" alt="Spinner icon" name="spinner" :invert="invert" :size="size" adaptive animated />
</template>

<style scoped></style>
