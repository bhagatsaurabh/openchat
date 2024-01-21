<script setup>
import Avatar from '../Common/Avatar/Avatar.vue';
import Button from '../Common/Button/Button.vue';
import Icon from '../Common/Icon/Icon.vue';

defineProps({
  profile: Object,
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
    <Icon :size="1.3" class="admin ml-0p5" v-if="profile.admin" name="admin" alt="admin icon" singular />
    <div class="controls">
      <Button @click="emit('action', 'remove', profile)" icon="cancel" :complementary="false" circular flat />
    </div>
  </div>
</template>

<style scoped>
.group-member {
  display: flex;
  align-items: center;
  padding: 0 0.5rem;
}

.name {
  flex: 1;
}
.admin {
  font-size: 0;
  filter: invert(72%) sepia(16%) saturate(943%) hue-rotate(42deg) brightness(96%) contrast(87%);
}
</style>
