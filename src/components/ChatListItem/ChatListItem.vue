<script setup>
import { computed } from 'vue';

import { days } from '@/utils/constants';

const props = defineProps({
  meta: Object
});

const msInADay = 1000 * 60 * 60 * 24;
const avatarUrl = computed(
  () => props.meta.avatarUrl ?? `/assets/icons/avatar${props.meta.type === 'group' ? '-group' : ''}.png`
);
const timestamp = computed(() => {
  const date = new Date(props.meta.lastMsg.timestamp);
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
</script>

<template>
  <div class="chat-item" tabindex="0">
    <span class="avatar">
      <img :src="avatarUrl" />
    </span>
    <div class="details">
      <div class="title">
        <span class="name">
          {{ meta.name }}
        </span>
        <span class="time">
          {{ timestamp }}
        </span>
      </div>
      <div class="msg">{{ meta.lastMsg.data }}</div>
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
  padding: 0.5rem;
  margin-right: 1rem;
  margin-top: 2px;
  border-radius: 5rem;
  font-size: 0;
  border: 1px solid var(--c-border-0);
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
}
.title .time {
  color: var(--c-text-2);
}
.msg {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
