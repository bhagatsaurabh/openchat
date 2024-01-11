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
import { schemaChange } from '@/database/database';
import { useMessagesStore } from './messages';

export const useGroupsStore = defineStore('groups', () => {
  const auth = useAuthStore();
  const remote = useRemoteDBStore();
  const messages = useMessagesStore();
  const users = useUsersStore();
  const groups = ref({});
  const activeGroup = ref(null);
  const activeGroupKey = ref(null);
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
    group.timestamp = group.timestamp.toDate();
    group.seen = group.seen?.map((seenTimestamp) => seenTimestamp.toDate());
    group.sync = group.sync?.map((syncTimestamp) => syncTimestamp.toDate());

    await local.updateGroup(auth.user.uid, group.id, group);
    addGroup(group);

    if (group.type === 'private') users.attachListener(group.members[1]);
    else await users.saveProfiles(group.members);

    messages.attachListener(group.id);
  };
  const handleError = (error) => console.log({ ...error });

  async function listen() {
    const localGroups = await local.getAllGroups(auth.user.uid);
    const self = localGroups.find((grp) => grp.id === 'self');
    if (self) {
      addGroup(self);
    }
    localGroups
      .filter((group) => group.active && group.id !== 'self')
      .forEach((group) => {
        const unsubscribe = onSnapshot(doc(remoteDB, 'groups', group.id), listener, handleError);
        unsubFns.value.push(unsubscribe);
      });
  }
  function stop() {
    unsubFns.value.forEach((unsubscribe) => unsubscribe());
  }
  async function setActiveGroup(id) {
    if (id && groups.value[id]) {
      activeGroup.value = groups.value[id];
      activeGroupKey.value = await local.getGroupKey(auth.user.uid, id);
    } else {
      activeGroup.value = null;
      activeGroupKey.value = null;
    }
  }
  function unsetActiveGroup() {
    activeGroup.value = null;
    activeGroupKey.value = null;
  }
  async function userAdded(data) {
    const { id, encryptedKey } = data.payload;

    await local.storeGroupKey(auth.user.uid, id, await base64ToBuf(encryptedKey));
    await schemaChange(auth.user.uid, id);
    attachListener(id);
    await remote.deleteNotification(data.id);
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
    await schemaChange(auth.user.uid, groupId);
    attachListener(groupId);

    if (type === 'private') users.attachListener(members[1]);
    else await users.saveProfiles(members);

    members.shift();
    const rawPublicKeys = await Promise.all(members.map((id) => remote.getPublicKey(id)));
    const publicKeys = await Promise.all(rawPublicKeys.map((rawPublicKey) => importPublicKey(rawPublicKey)));
    publicKeys.unshift(auth.encKey);

    const encryptedKeys = await generateGroupKey(publicKeys);
    await local.storeGroupKey(auth.user.uid, groupId, encryptedKeys.shift());
    const encryptedKeyCiphers = await Promise.all(
      encryptedKeys.map((encryptedKey) => bufToBase64(encryptedKey))
    );
    await Promise.all(
      encryptedKeyCiphers.map((encryptedKeyCipher, idx) =>
        remote.notifyUserAdded({ uid: members[idx], groupId, encryptedKey: encryptedKeyCipher })
      )
    );

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
      unseenCount: 0,
      active: true
    };

    const encryptedKey = (await generateGroupKey([auth.encKey]))[0];
    await local.storeGroupKey(auth.user.uid, 'self', encryptedKey);
    await local.updateGroup(auth.user.uid, group.id, group);
    await schemaChange(auth.user.uid, group.id);

    addGroup(group);
    return 'self';
  }
  function attachListener(groupId) {
    const unsubscribe = onSnapshot(doc(remoteDB, 'groups', groupId), listener, handleError);
    unsubFns.value.push(unsubscribe);
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
    activeGroupKey,
    getDMGroupByUID,
    addGroup,
    setActiveGroup,
    unsetActiveGroup,
    getGroupByID,
    userAdded,
    userRemoved,
    listen,
    stop,
    createGroup,
    createSelfGroup,
    attachListener
  };
});
