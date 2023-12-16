<script setup>
import Button from '@/components/Common/Button/Button.vue';
</script>

<template>
  <Button :size="2.5" class="avatar" icon="guest" :complementary="false" circular flat />
</template>

<style scoped>
.avatar {
  box-shadow: none !important;
}
</style>
