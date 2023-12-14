<script setup>
import Button from '@/components/Common/Button/Button.vue';
</script>

<template>
  <Button :size="2.5" class="avatar" icon="guest" :complementary="false" visual circular />
</template>

<style scoped>
.avatar {
  box-shadow: none !important;
  border: 1px solid var(--c-border-0) !important;
  padding: 0.5rem !important;
}
</style>
