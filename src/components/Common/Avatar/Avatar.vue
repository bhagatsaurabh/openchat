<script setup>
import Button from '@/components/Common/Button/Button.vue';

const emit = defineEmits(['open']);
</script>

<template>
  <Button
    @click="() => emit('open')"
    :size="2.5"
    class="avatar"
    icon="guest"
    :complementary="false"
    circular
    flat
  />
</template>

<style scoped>
.avatar {
  box-shadow: none !important;
}
</style>
