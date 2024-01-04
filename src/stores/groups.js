import { ref } from 'vue';
import { defineStore } from 'pinia';

import { useAuthStore } from './auth';
import * as local from '@/database/driver';

export const useGroupsStore = defineStore('groups', () => {
  const auth = useAuthStore();
  const groups = ref([]);
  const activeGroup = ref(null);

  async function load() {
    return await local.getAllGroups(auth.user.uid);
  }
  function addGroup(group) {
    groups.value.push(group);
  }
  function getDMGroupByUID(otherUserId) {
    return groups.value
      .filter((group) => group.type === 'private')
      .find((group) => group.members.includes(otherUserId));
  }
  function setActiveGroup(id) {
    const group = groups.value.find((grp) => grp.id === id);
    if (group) activeGroup.value = group;
  }

  return {
    groups,
    activeGroup,
    load,
    getDMGroupByUID,
    addGroup,
    setActiveGroup
  };
});
