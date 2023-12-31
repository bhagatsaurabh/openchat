<script setup>
import Icon from '@/components/Common/Icon/Icon.vue';
import Button from '@/components/Common/Button/Button.vue';

const props = defineProps({
  data: Object
});

const emit = defineEmits(['dismiss', 'action']);
</script>

<template>
  <Transition name="slide" appear>
    <div class="snackbar" v-if="data">
      <Icon :size="1.5" class="icon" :alt="data.status" :name="data.status" singular />
      <span class="message">{{ data.message }}</span>
      <Button @click="() => emit('action')" v-if="data.action">{{ data.action }}</Button>
      <Button icon="close" @click="() => emit('dismiss')" :complementary="false" circular />
    </div>
  </Transition>
</template>

<style scoped>
.snackbar {
  transform-origin: bottom;
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100vw;
  z-index: 100;
  padding: 1rem;
  display: flex;
  align-items: center;
  box-shadow: 0 0 10px 0 var(--c-shadow-0);
  background-color: var(--c-background-2);
  font-size: 1rem;
}

.snackbar .icon {
  font-size: 0;
  margin-right: 0.5rem;
}
.snackbar .message {
  margin-right: 0.5rem;
  flex: 1;
}
</style>
