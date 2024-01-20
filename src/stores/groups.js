import { ref } from 'vue';
import { defineStore } from 'pinia';

import { useAuthStore } from './auth';
import * as local from '@/database/driver';
import { useRemoteDBStore } from './remote';
import { base64ToBuf, bufToBase64, sysMsgUserAdded } from '@/utils/utils';
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
      queue.push(data);
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
    await setLastMessage(group);

    group.timestamp = group.timestamp.toDate();
    Object.keys(group.seen ?? {}).forEach(
      (id) => (group.seen[id] = group.seen[id] ? group.seen[id].toDate() : new Date())
    );
    Object.keys(group.sync ?? {}).forEach(
      (id) => (group.sync[id] = group.sync[id] ? group.sync[id].toDate() : new Date())
    );

    await users.saveProfiles(group.members);

    if (group.type === 'private') {
      let otherUserId = group.members.find((id) => id !== auth.user.uid);
      group.name = users.users[otherUserId].name;
      users.attachListener(otherUserId);
    }

    await local.updateGroup(auth.user.uid, group.id, group);
    addGroup(group);

    messages.attachListener(group.id);
  };
  const handleError = (error) => console.log({ ...error });

  async function listen() {
    const localGroups = await local.getAllGroups(auth.user.uid);
    const self = localGroups.find((grp) => grp.id === 'self');
    if (self) addGroup(self);

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
      await messages.openStream(id);
    } else {
      activeGroup.value = null;
      activeGroupKey.value = null;
    }
  }
  function unsetActiveGroup() {
    const id = activeGroup.value.id;
    activeGroup.value = null;
    activeGroupKey.value = null;
    messages.unload(id);
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
    groups.value[group.id] = { ...group };
  }
  async function createGroup({ name, type, members = [], avatarUrl = '' }) {
    if (type === 'private') {
      const existing = getDMGroupByUID(members[1].id);
      if (existing) {
        return existing.id;
      }
    }

    const uids = members.map((member) => member.id);
    let group = {
      name: name,
      type,
      members: uids,
      admins: type === 'private' ? [...uids] : [auth.user.uid],
      avatarUrl: type === 'private' ? members[1].avatarUrl : avatarUrl
    };
    const groupId = await remote.createGroup(group);
    await schemaChange(auth.user.uid, groupId);
    attachListener(groupId);

    if (type === 'private') users.attachListener(members[1].id);
    else await users.saveProfiles(uids);

    members.shift();
    const rawPublicKeys = await Promise.all(members.map((member) => remote.getPublicKey(member.id)));
    const publicKeys = await Promise.all(rawPublicKeys.map((rawPublicKey) => importPublicKey(rawPublicKey)));
    publicKeys.unshift(auth.encKey);

    const encryptedKeys = await generateGroupKey(publicKeys);
    await local.storeGroupKey(auth.user.uid, groupId, encryptedKeys.shift());
    const encryptedKeyCiphers = await Promise.all(
      encryptedKeys.map((encryptedKey) => bufToBase64(encryptedKey))
    );
    await Promise.all(
      encryptedKeyCiphers.map((encryptedKeyCipher, idx) =>
        remote.notifyUserAdded({ uid: members[idx].id, groupId, encryptedKey: encryptedKeyCipher })
      )
    );

    group = { ...group, active: true, seen: {}, sync: {}, timestamp: null, id: groupId };
    await setLastMessage(group);
    addGroup(group);
    return groupId;
  }
  async function createSelfGroup() {
    const existing = getGroupByID('self');
    if (existing) {
      return existing.id;
    }

    const sysMsg = sysMsgUserAdded('self');
    const group = {
      name: 'Me',
      type: 'private',
      members: [auth.user.uid],
      admins: [auth.user.uid],
      avatarUrl: auth.profile.avatarUrl,
      timestamp: new Date(),
      id: 'self',
      unseenCount: 0,
      active: true,
      lastMsg: { by: sysMsg.by, timestamp: sysMsg.timestamp, type: sysMsg.type, text: sysMsg.text }
    };

    const encryptedKey = (await generateGroupKey([auth.encKey]))[0];
    await local.storeGroupKey(auth.user.uid, 'self', encryptedKey);
    await local.updateGroup(auth.user.uid, group.id, group);
    await schemaChange(auth.user.uid, group.id);

    addGroup(group);
    local.storeMessage(sysMsg);
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

  async function removeMember(group, user) {
    if (!group.admins.includes(auth.user.uid)) return;

    const newMemberList = [...group.members];
    const newAdminList = [...group.admins];
    const midx = newMemberList.findIndex((id) => id === user.id);
    const aidx = newAdminList.findIndex((id) => id === user.id);
    if (midx >= 0) newMemberList.splice(midx, 1);
    if (aidx >= 0) newAdminList.splice(aidx, 1);

    await remote.updateGroup(
      aidx >= 0 ? { members: newMemberList, admins: newAdminList } : { members: newMemberList }
    );
  }
  async function makeAdmin(group, user) {
    if (!group.admins.includes(auth.user.uid)) return;

    if (!group.admins.includes(user.id)) {
      const newAdminList = [...group.admins];
      newAdminList.push(user.id);
      await remote.updateGroup({ admins: newAdminList });
    }
  }
  async function revokeAdmin(group, user) {
    if (!group.admins.includes(auth.user.uid)) return;

    const newAdminList = [...group.admins];
    const idx = newAdminList.findIndex((id) => id === user.id);
    if (idx >= 0) {
      newAdminList.splice(idx, 1);
      await remote.updateGroup({ admins: newAdminList });
    }
  }
  async function setLastMessage(group) {
    const localGroup = await local.getGroup(auth.user.uid, group.id);
    let sysMsg;
    if (localGroup) group.lastMsg = localGroup.lastMsg;
    else {
      sysMsg = sysMsgUserAdded(group.id);
      await local.storeMessage(sysMsg);
      group.lastMsg = { by: sysMsg.by, timestamp: sysMsg.timestamp, type: sysMsg.type, text: sysMsg.text };
    }
    return sysMsg;
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
    attachListener,
    removeMember,
    makeAdmin,
    revokeAdmin
  };
});
