<script setup>
import { computed, onMounted, ref } from 'vue';

import { useMessagesStore } from '@/stores/messages';
import { useUsersStore } from '@/stores/users';
import { useAuthStore } from '@/stores/auth';
import Spinner from '../Common/Spinner/Spinner.vue';
import Tail from '@/components/Common/Tail/Tail.vue';

const props = defineProps({
  message: Object,
  private: {
    type: Boolean,
    default: false
  }
});

const usersStore = useUsersStore();
const messagesStore = useMessagesStore();
const auth = useAuthStore();
const content = ref(null);

const time = computed(() => props.message.timestamp.toTimeString().substring(0, 5));
const name = computed(() => usersStore.users[props.message.by].name);
const initials = computed(() =>
  usersStore.users[props.message.by].name
    .split(' ')
    .map((part) => part[0].toUpperCase())
    .join('')
);
const isSelf = computed(() => props.message.by === auth.user.uid);

onMounted(async () => {
  if (props.message.local) content.value = props.message.text;
  else content.value = await messagesStore.decrypt(props.message.type, props.message.text);
});
</script>

<template>
  <div class="message" :class="{ me: isSelf }">
    <div class="container">
      <div v-if="!content" class="suspense">
        <Spinner />
      </div>
      <template v-else>
        <div v-if="!isSelf" class="avatar">
          <img
            v-if="usersStore.users[message.by]?.avatarUrl"
            alt="avatar icon"
            :src="usersStore.users[message.by].avatarUrl"
          />
          <span class="initials" v-else>{{ initials }}</span>
          <h3 class="name">{{ name }}</h3>
        </div>
        <div class="content">
          <span class="tail">
            <Tail />
          </span>
          <span class="data">{{ content }}</span>
          <h5 class="time">{{ time }}</h5>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.message {
  width: 100%;
  margin-bottom: 1rem;
  display: flex;
}
.message .container {
  max-width: 75vw;
  min-width: 25vw;
}
.message.me .container {
  margin-right: 0.75rem;
  margin-left: auto;
}

.message .content {
  background-color: var(--c-accent-light-4);
  box-shadow: 3px 3px 6px -3px var(--c-text-0);
  border-radius: 0.5rem;
  padding: 0.25rem 0.5rem 0.25rem 0.5rem;
  border-top-right-radius: unset;
}
.message .content .tail {
  position: absolute;
  top: 0;
  right: 0;
  color: var(--c-accent-light-4);
  font-size: 0;
  right: 0;
  transform: translateX(100%);
}

.message .content::after {
  content: '';
  position: absolute;
  display: block;
  width: 6px;
  background: transparent;
  height: 6px;
  z-index: -1;
  box-shadow: 3px 3px 5px 0px var(--c-text-1);
  top: 0;
  right: -2px;
}

.message .content .time {
  color: var(--c-text-2);
  text-align: right;
}
</style>
