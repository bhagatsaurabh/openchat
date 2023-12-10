<script setup>
import Snackbar from '@/component/Common/Snackbar/Snackbar.vue';
import Banner from '@/component/Common/Banner/Banner.vue';

const props = defineProps({
  type: {
    type: String,
    validator: (val) => ['snackbar', 'banner'].includes(val)
  }
});

const notificationComponent = props.type === 'snackbar' ? Snackbar : Banner;
</script>

<template>
  <component :is="notificationComponent" />
</template>

<style scoped></style>
