<script setup>
import { computed, ref } from 'vue';

import { useUsersStore } from '@/stores/users';
import GroupMemberItem from '../GroupMemberItem/GroupMemberItem.vue';
import Modal from '../Common/Modal/Modal.vue';

const props = defineProps({
  group: Object,
  admin: {
    type: Boolean,
    default: false
  }
});

const usersStore = useUsersStore();
const showConfirm = ref(null);
const members = computed(() => {
  return props.group.members.map((member) => ({
    ...usersStore.users[member],
    admin: props.group.admins.includes(member)
  }));
});

const handleAction = (action, user) => {
  if (action === 'remove')
    showConfirm.value = { title: `Remove ${user.name} from group ?`, action: handleRemove, user };
  else if (action === 'admin')
    showConfirm.value = { title: `Make ${user.name} an admin ?`, action: handleMakeAdmin, user };
  else if (action === 'revoke')
    showConfirm.value = { title: `Revoke adminship from ${user.name} ?`, action: handleRevokeAdmin, user };
};
const handleRemove = () => {
  console.log('remove', showConfirm.value.user.name);
};
const handleMakeAdmin = () => {
  console.log('admin', showConfirm.value.user.name);
};
const handleRevokeAdmin = () => {
  console.log('revoke', showConfirm.value.user.name);
};
</script>

<template>
  <Modal
    v-if="!!showConfirm"
    :title="showConfirm.title"
    :controls="[{ text: 'Yes', async: true, action: showConfirm.action }, { text: 'Cancel' }]"
    @dismiss="() => (showConfirm = null)"
  >
    Are you sure ?
  </Modal>
  <ul class="members-list">
    <li v-for="member in members" :key="member.id">
      <GroupMemberItem :profile="member" :admin="admin" @action="handleAction" />
    </li>
  </ul>
</template>

<style scoped>
.members-list {
  list-style: none;
  padding: 0;
}
</style>
