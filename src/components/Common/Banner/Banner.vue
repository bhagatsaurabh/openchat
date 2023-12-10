<script setup>
import Icon from '@/components/Common/Icon/Icon.vue';
import Button from '@/components/Common/Button/Button.vue';

const props = defineProps({
  data: Object
});

const emit = defineEmits(['dismiss', 'action']);
</script>

<template>
  <Transition name="fade-slide-ltr" appear>
    <div class="banner" v-if="data">
      <Icon :alt="data.type" :name="data.type" singular />
      <span>{{ data.message }}</span>
      <Button @click="() => emit('action')" v-if="data.action">{{ data.action }}</Button>
      <Button @click="() => emit('dismiss')" />
    </div>
  </Transition>
</template>

<style scoped>
.banner {
  position: fixed;
  top: 0;
  right: 0;
  width: 100vw;
}
</style>
