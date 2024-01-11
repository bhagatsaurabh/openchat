<script setup>
import { useMessagesStore } from '@/stores/messages';
import { useUsersStore } from '@/stores/users';
import { computed, onMounted, ref } from 'vue';
import Spinner from '../Common/Spinner/Spinner.vue';

const props = defineProps({
  message: Object,
  private: {
    type: Boolean,
    default: false
  }
});

const usersStore = useUsersStore();
const messagesStore = useMessagesStore();
const content = ref(null);

const time = computed(() => props.message.timestamp.toTimeString().substring(0, 5));
const name = computed(() => usersStore.users[props.message.by].name);

onMounted(async () => {
  content.value = await messagesStore.decrypt(props.message.type, props.message.text);
});
</script>

<template>
  <div class="message">
    <div v-if="!content" class="suspense">
      <Spinner />
    </div>
    <template v-else>
      <h3 class="name">{{ name }}</h3>
      <section class="content">{{ content }}</section>
      <h4 class="time">{{ time }}</h4>
    </template>
  </div>
</template>

<style scoped>
.message {
  background-color: var(--c-background-1);
  box-shadow: 0 0 0.25rem 0 var(--c-text-0);
}
.message::before {
  content: '';
  width: 0;
  height: 0;
  position: absolute;
  border:
    0.5rem solid #00bfb6,
    0.5rem solid #00bfb6,
    0.5rem solid transparent,
    0.5rem solid transparent;
  left: 1rem;
  top: 0;
}
</style>
