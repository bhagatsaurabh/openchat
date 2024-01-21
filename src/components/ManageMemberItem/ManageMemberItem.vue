<script setup>
import Avatar from '../Common/Avatar/Avatar.vue';
import Button from '../Common/Button/Button.vue';

defineProps({
  profile: Object,
  adminControl: {
    type: Boolean,
    default: false
  },
  admin: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['action']);
</script>

<template>
  <div class="group-member">
    <Avatar class="avatar mr-0p5" :url="profile.avatarUrl" />
    <span class="name ellipsis">{{ profile.name }}</span>
    <div class="controls">
      <Button
        v-if="adminControl"
        class="admin"
        icon="admin"
        :complementary="false"
        @click="emit('action', admin ? 'revoke' : 'admin', profile)"
        icon-left
      >
        <span class="fs-0p8">{{ admin ? 'Revoke admin' : 'Make admin' }}</span>
      </Button>
      <Button @click="emit('action', 'remove', profile)" icon="cancel" :complementary="false" circular flat />
    </div>
  </div>
</template>

<style scoped>
.group-member {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.5rem;
}
.name {
  flex: 1;
}
.admin {
  margin-right: 0.5rem;
  margin-left: 0.5rem;
  padding: 0.5rem;
  box-shadow: none;
  border: 1px solid var(--c-border-1);
}
.admin:deep(.icon-container) {
  font-size: 0;
  filter: invert(72%) sepia(16%) saturate(943%) hue-rotate(42deg) brightness(96%) contrast(87%);
}
</style>
