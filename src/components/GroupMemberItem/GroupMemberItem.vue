<script setup>
import Avatar from '../Common/Avatar/Avatar.vue';
import Icon from '../Common/Icon/Icon.vue';
import Options from '../Common/Options/Options.vue';

defineProps({
  profile: Object,
  admin: {
    type: Boolean,
    default: false
  },
  showOptions: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['action']);

const getAction = (option) => {
  if (option === 'Remove') return 'remove';
  else if (option === 'Make admin') return 'admin';
  else return 'revoke';
};
</script>

<template>
  <div class="group-member">
    <Avatar class="avatar mr-0p5" :url="profile.avatarUrl" />
    <span class="name ellipsis">{{ profile.name }}</span>
    <Icon
      :size="1.3"
      class="admin ml-0p5"
      :class="{ 'mr-3p1': !showOptions }"
      v-if="profile.admin"
      name="admin"
      alt="admin icon"
      singular
    />
    <Options
      v-if="admin && showOptions"
      class="options"
      icon="options"
      :options="[
        { text: 'Remove', icon: 'remove' },
        { text: profile.admin ? 'Revoke adminship' : 'Make admin', icon: profile.admin ? 'revoke' : 'admin' }
      ]"
      @select="(option) => emit('action', getAction(option.text), profile)"
    />
  </div>
</template>

<style scoped>
.group-member {
  display: flex;
  align-items: center;
}

.name {
  flex: 1;
}
.admin {
  font-size: 0;
  filter: invert(72%) sepia(16%) saturate(943%) hue-rotate(42deg) brightness(96%) contrast(87%);
}
.options {
  margin-left: 0.5rem;
}
</style>
