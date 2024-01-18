<script setup>
import { computed } from 'vue';

import { days } from '@/utils/constants';
import { useAuthStore } from '@/stores/auth';
import { useUsersStore } from '@/stores/users';
import Icon from '../Common/Icon/Icon.vue';

const props = defineProps({
  group: Object
});

const auth = useAuthStore();
const usersStore = useUsersStore();
const emit = defineEmits(['select']);

const msInADay = 1000 * 60 * 60 * 24;
const avatarUrl = computed(() => {
  let url = props.group.avatarUrl;
  if (props.group.id === 'self') url = auth.profile?.avatarUrl;
  else if (props.group.type === 'private') {
    const otherUserId = props.group.members.find((id) => id !== auth.user.uid);
    url = usersStore.users[otherUserId]?.avatarUrl;
  }
  return url || `/assets/icons/avatar${props.group.type === 'broadcast' ? '-group' : ''}.png`;
});
const defAvatar = computed(
  () => avatarUrl.value === '/assets/icons/avatar-group.png' || avatarUrl.value === '/assets/icons/avatar.png'
);
const timestamp = computed(() => {
  const date = props.group.lastMsg?.timestamp ?? props.group.timestamp ?? new Date();
  const today = new Date();
  const delta = (today - date) / msInADay;
  if (delta < 1) {
    return date.toTimeString().slice(0, 5);
  } else if (delta < 5) {
    return days[date.getDay()];
  } else {
    return date.toISOString().slice(0, 10).replaceAll('-', '/');
  }
});
const lastMsgBy = computed(() => usersStore.users[props.group.lastMsg?.by]?.name);
const lastMsgText = computed(() => props.group.lastMsg?.text);
const lastMsgType = computed(() => props.group.lastMsg?.type);
const otherUserId = computed(() =>
  props.group.type === 'private' ? props.group.members.find((id) => id !== auth.user.uid) : null
);
</script>

<template>
  <div class="chat-item" tabindex="0" @click="emit('select', group.id)">
    <span class="avatar" :class="{ default: defAvatar }">
      <img :src="avatarUrl" alt="group avatar" />
    </span>
    <div class="details">
      <div class="title">
        <span class="name">
          {{ group.name }}
        </span>
        <span class="time">
          {{ timestamp }}
        </span>
      </div>
      <div class="msg" :class="{ sys: group.lastMsg?.by === 'system' }">
        <div class="text">
          <span
            v-if="lastMsgBy && (group.type !== 'private' || group.lastMsg?.by !== otherUserId)"
            class="by ellipsis"
          >
            {{ (group.lastMsg?.by === auth.user.uid ? 'Me' : lastMsgBy) + ':' }}&nbsp;
          </span>
          <Icon
            v-if="lastMsgType && lastMsgType !== 'text'"
            :size="0.8"
            :name="group.lastMsg?.type"
            alt="icon"
          />
          <span v-if="lastMsgText" class="d-inline-block ellipsis">{{ lastMsgText }}</span>
        </div>
        <span v-if="group.unseenCount > 0" class="count">
          {{ group.unseenCount }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-item {
  display: flex;
  padding: 0.5rem 1rem 0.5rem 1rem;
  align-items: center;
  border-bottom: 1px solid var(--c-border-0);
}
.avatar {
  margin-right: 1rem;
  margin-top: 2px;
  border-radius: 5rem;
  font-size: 0;
  border: 1px solid var(--c-border-0);
}
.avatar img {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
}
.avatar.default img {
  padding: 0.35rem;
}
.details {
  flex: 1;
  overflow: hidden;
}
.title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.title .name {
  font-size: 1.4rem;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.title .time {
  color: var(--c-text-2);
}
.msg {
  display: flex;
  align-items: center;
}
.msg .text {
  flex: 1;
  width: 100%;
  display: flex;
}
.msg .text span:last-child {
  color: var(--c-text-2);
}
.msg.sys .text span:last-child {
  font-style: italic;
  font-weight: lighter;
}
.msg .text .by {
  display: inline-block;
  min-width: 2rem rem;
  max-width: 5rem;
}
.msg .count {
  padding: 0.2rem 0.35rem 0.2rem 0.35rem;
  border-radius: 1rem;
  line-height: 1;
  background-color: var(--c-accent);
  color: var(--c-background-0);
  font-weight: bold;
}
</style>
