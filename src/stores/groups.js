import { ref } from 'vue';
import { defineStore } from 'pinia';

import { useAuthStore } from './auth';
import * as local from '@/database/driver';
import { useRemoteDBStore } from './remote';
import { base64ToBuf, bufToBase64 } from '@/utils/utils';
import { Queue } from '@/utils/queue';
import { doc, onSnapshot } from 'firebase/firestore';
import { remoteDB } from '@/config/firebase';
import { generateGroupKey, importPublicKey } from '@/utils/crypto';
import { useUsersStore } from './users';

export const useGroupsStore = defineStore('groups', () => {
  const auth = useAuthStore();
  const remote = useRemoteDBStore();
  const users = useUsersStore();
  const groups = ref({});
  const activeGroup = ref(null);
  const unsubFns = ref([]);
  const busy = ref(false);
  const queue = new Queue();

  const listener = (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      data.id = snapshot.id;
      queue.push(snapshot.data());
      process();
    }
  };
  const process = async () => {
    if (busy.value) return;
    else {
      busy.value = true;
      let group;
      while ((group = queue.pop()) !== null) {
        await handleGroup(group);
      }
      busy.value = false;
    }
  };
  const handleGroup = async (group) => {
    await local.updateGroup(auth.user.uid, group.id, group);
    addGroup(group);
  };
  const handleError = (error) => console.log({ ...error });

  function listen() {
    const localGroups = local.getAllGroups();
    localGroups
      .filter((group) => group.active)
      .forEach((group) => {
        const unsubscribe = onSnapshot(doc(remoteDB, 'groups', group.id), listener, handleError);
        unsubFns.value.push(unsubscribe);
      });
  }
  function stop() {
    unsubFns.value.forEach((unsubscribe) => unsubscribe());
  }
  function setActiveGroup(id) {
    activeGroup.value = groups.value[id] ?? null;
  }
  async function userAdded(data) {
    const { id, encryptedKey } = data.payload;

    const group = await remote.getGroup(id);
    group.id = id;
    group.unseenCount = 1;

    await local.createGroupKey(auth.user.uid, id, await base64ToBuf(encryptedKey));
    await local.createGroup(auth.user.uid, group);
    await remote.deleteNotification(data.id);
    addGroup(group);
  }
  async function userRemoved(data) {
    const { id } = data.payload;

    await local.deleteGroupKey(auth.user.uid, id);
    await local.updateGroup(auth.user.uid, id, { active: false, unseenCount: 1 });
    await remote.deleteNotification(data.id);
  }
  function addGroup(group) {
    groups.value[group.id] = group;
  }
  async function createGroup({ name, type, members = [], avatarUrl = '' }) {
    // Check if DM Group already exists
    if (type === 'private') {
      const existing = getDMGroupByUID(members[1].id);
      if (existing) {
        return existing.id;
      }
    }

    const groupId = await remote.createGroup({
      name: name,
      type,
      members: [...members],
      admins: type === 'private' ? [...members] : [auth.user.uid],
      avatarUrl: type === 'private' ? members[1].avatarUrl : avatarUrl
    });
    // Need to fetch newly created group to get resolved serverTimestamps
    const group = await remote.getGroup(groupId);
    group.id = groupId;
    group.unseenCount = 0;

    await users.saveProfiles(members);

    members.shift();
    const rawPublicKeys = await Promise.all(members.map((id) => remote.getPublicKey(id)));
    const publicKeys = await Promise.all(rawPublicKeys.map((rawPublicKey) => importPublicKey(rawPublicKey)));
    publicKeys.unshift(auth.encKey);

    const encryptedKeys = await generateGroupKey(publicKeys);
    await local.createGroupKey(auth.user.uid, groupId, encryptedKeys.shift());
    await local.createGroup(auth.user.uid, group);
    const encryptedKeyCiphers = await Promise.all(
      encryptedKeys.map((encryptedKey) => bufToBase64(encryptedKey))
    );
    await Promise.all(
      encryptedKeyCiphers.map((encryptedKeyCipher, idx) =>
        remote.notifyUserAdded({ uid: members[idx], groupId, encryptedKey: encryptedKeyCipher })
      )
    );

    addGroup(group);
    return groupId;
  }
  async function createSelfGroup() {
    const existing = getGroupByID('self');
    if (existing) {
      return existing.id;
    }

    const group = {
      name: 'Me',
      type: 'private',
      members: [auth.user.uid],
      admins: [auth.user.uid],
      avatarUrl: auth.profile.avatarUrl,
      timestamp: new Date(),
      id: 'self',
      unseenCount: 0
    };

    const encryptedKey = (await generateGroupKey([auth.encKey]))[0];
    await local.createGroupKey(auth.user.uid, 'self', encryptedKey);
    await local.createGroup(auth.user.uid, group);

    addGroup(group);
    return 'self';
  }

  function getDMGroupByUID(otherUserId) {
    return Object.values(groups.value)
      .filter((group) => group.type === 'private')
      .find((group) => group.members.includes(otherUserId));
  }
  function getGroupByID(id) {
    return groups.value[id] ?? null;
  }

  return {
    groups,
    activeGroup,
    getDMGroupByUID,
    addGroup,
    setActiveGroup,
    getGroupByID,
    userAdded,
    userRemoved,
    listen,
    stop,
    createGroup,
    createSelfGroup
  };
});
