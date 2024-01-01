<script setup>
import { computed } from 'vue';

const props = defineProps({
  meta: Object
});
const emit = defineEmits(['select']);

const avatarUrl = computed(() => (!props.meta.avatarUrl ? '/assets/icons/user.png' : props.meta.avatarUrl));
const isVerified = computed(() => !!props.meta.phone);
</script>

<template>
  <div class="user-item" tabindex="0" @click="emit('select', meta)">
    <span class="avatar" :class="{ verified: isVerified, default: avatarUrl === '/assets/icons/user.png' }">
      <img :src="avatarUrl" />
    </span>
    <div class="details">
      <div class="title">
        <span class="name">
          {{ meta.name }}
        </span>
        <span class="status">
          {{ isVerified ? 'Verified' : 'Guest' }}
        </span>
      </div>
      <div class="phone">{{ meta.phone }}</div>
    </div>
  </div>
</template>

<style scoped>
.user-item {
  display: flex;
  padding: 0.5rem 1rem 0.5rem 1rem;
  align-items: center;
  border-bottom: 1px solid var(--c-border-0);
}
.avatar {
  margin-right: 1rem;
  border-radius: 5rem;
  font-size: 0;
  border: 1px solid var(--c-border-0);
  width: 3rem;
}
.avatar.default {
  padding: 0.5rem;
  margin-top: 2px;
}
.avatar.verified {
  border: 1px solid var(--c-accent);
}
.avatar.verified::after {
  content: '';
  position: absolute;
  bottom: -0.125rem;
  width: 1rem;
  box-shadow: 0 0 5px 0px grey;
  border-radius: 1rem;
  right: -0.125rem;
  height: 1rem;
  background-image: url(/assets/icons/verified.png);
  background-size: 100%;
}
.avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}
.avatar.default img {
  opacity: 0.3;
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
.title .status {
  color: var(--c-text-2);
}
.phone {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
