<script setup>
import Button from '@/components/Common/Button/Button.vue';

defineProps({
  url: String
});

const emit = defineEmits(['open']);
</script>

<template>
  <Button
    @click="() => emit('open')"
    :size="2.5"
    class="avatar"
    :icon="`src#${url}`"
    :complementary="false"
    circular
    flat
  />
</template>

<style scoped>
.avatar {
  box-shadow: none !important;
}
.avatar:deep(img) {
  border-radius: 50%;
}
</style>
