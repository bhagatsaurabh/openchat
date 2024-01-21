<script setup>
import { watch, onBeforeUnmount, ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';

import { useAuthStore } from '@/stores/auth';
import { useUsersStore } from '@/stores/users';
import { useNotificationStore } from '@/stores/notification';
import { useGroupsStore } from '@/stores/groups';
import { trapBetween, trapFocus, symDiff } from '@/utils/utils';
import Button from '@/components/Common/Button/Button.vue';
import Tabs from '@/components/Common/Tabs/Tabs.vue';
import ManageMemberItem from '@/components/ManageMemberItem/ManageMemberItem.vue';
import ChatSearchList from '@/components/ChatSearchList/ChatSearchList.vue';
import ChatSearch from '../ChatSearch/ChatSearch.vue';

const props = defineProps({
  group: Object
});
const emit = defineEmits(['back', 'open-search']);

const router = useRouter();
const auth = useAuthStore();
const usersStore = useUsersStore();
const groups = useGroupsStore();
const notify = useNotificationStore();
const el = ref(null);
const bound = ref(null);
const show = ref(false);
const query = ref('');
const searchEl = ref(null);
const tabs = ref([
  { name: 'Members', id: 'members', icon: 'members', count: 0 },
  { name: 'Find', id: 'find', icon: 'search' }
]);
const activeTab = ref(0);
const orgGroup = ref({
  members: [...props.group.members.filter((id) => id !== auth.user.uid)],
  admins: [...props.group.admins.filter((id) => id !== auth.user.uid)]
});
const edtGroup = ref({
  members: [...props.group.members.filter((id) => id !== auth.user.uid)],
  admins: [...props.group.admins.filter((id) => id !== auth.user.uid)]
});
const orgCount = ref(orgGroup.value.members.length);
const isBusy = ref(false);
const isDirty = ref(false);
const members = ref(edtGroup.value.members.map((id) => usersStore.users[id]));
const selected = computed(() => new Set(edtGroup.value.members));

const keyListener = (event) => trapFocus(event, el.value, bound.value);

const handleDismiss = () => {
  if (show.value) {
    window.removeEventListener('keydown', keyListener);
    show.value = false;
    router.back();
  }
};
const handleLeave = () => {
  if (isBusy.value) return;
  emit('back');
};
const handleEdit = async () => {
  if (edtGroup.value.members.length + 1 < 3) {
    notify.push({
      type: 'snackbar',
      status: 'warn',
      message: 'Cannot update this group to less than 3 members, use Search instead to chat privately'
    });
    return;
  }

  isBusy.value = true;
  const newUserIds = edtGroup.value.members.filter((id) => !orgGroup.value.members.includes(id));
  const removedUserIds = orgGroup.value.members.filter((id) => !edtGroup.value.members.includes(id));
  await groups.updateGroup(props.group.id, {
    members: [auth.user.uid, ...edtGroup.value.members],
    admins: [auth.user.uid, ...edtGroup.value.admins]
  });

  await groups.notifyNewMembers(newUserIds, props.group.id);
  await groups.notifyRemovedMembers(removedUserIds, props.group.id);
  isBusy.value = false;
  handleDismiss();
};
const handleSearchSelect = (otherUser) => {
  if (isBusy.value) return;
  if (!edtGroup.value.members.includes(otherUser.id)) {
    edtGroup.value.members.push(otherUser.id);
    members.value.push(otherUser);
  } else {
    edtGroup.value.members.splice(
      edtGroup.value.members.findIndex((id) => id === otherUser.id),
      1
    );
    if (edtGroup.value.admins.includes(otherUser.id)) {
      edtGroup.value.admins.splice(
        edtGroup.value.admins.findIndex((id) => id === otherUser.id),
        1
      );
    }
  }
  tabs.value[0].count = edtGroup.value.members.length - orgCount.value;
  edtGroup.value = { ...edtGroup.value };
};
const handleAction = (action, user) => {
  if (isBusy.value) return;

  if (action === 'remove') handleSearchSelect(user);
  else if (action === 'admin' || action === 'revoke') {
    if (!edtGroup.value.admins.includes(user.id)) {
      edtGroup.value.admins.push(user.id);
    } else {
      edtGroup.value.admins.splice(
        edtGroup.value.admins.findIndex((id) => id === user.id),
        1
      );
    }
    edtGroup.value = { ...edtGroup.value };
  }
};
const isAdmin = (user) => edtGroup.value.admins.includes(user.id);

let unregisterGuard = () => {};
watch(
  show,
  async (newVal, oldVal) => {
    if (oldVal !== newVal && newVal) {
      await router.push({ hash: '#manage' });
      searchEl.value.focus();

      unregisterGuard = router.beforeEach((_to, from, next) => {
        if (from.hash === '#manage') {
          window.removeEventListener('keydown', keyListener);
          show.value = false;
        }
        unregisterGuard();
        next();
      });
    }
  },
  { immediate: true }
);
watch(el, () => {
  if (el.value) {
    bound.value = trapBetween(el.value);
    window.addEventListener('keydown', keyListener);
  }
});
watch(query, () => !!query.value && (activeTab.value = 1));
watch(edtGroup, () => {
  const memberSymDiff = symDiff(orgGroup.value.members, edtGroup.value.members);
  const adminSymDiff = symDiff(orgGroup.value.admins, edtGroup.value.admins);

  isDirty.value = memberSymDiff.length || adminSymDiff.length;
});

onMounted(() => {
  document.activeElement?.blur();
  show.value = true;
});
onBeforeUnmount(unregisterGuard);
</script>

<template>
  <Transition @after-leave="handleLeave" v-bind="$attrs" name="slide-right" appear>
    <aside v-if="show" ref="el" class="manage-members">
      <header>
        <Button
          class="mt-0p1"
          @click="handleDismiss"
          :size="1.2"
          icon="back"
          :complementary="false"
          circular
          flat
        />
        <h2 class="ml-1">Manage members</h2>
      </header>
      <div class="container">
        <ChatSearch ref="searchEl" @search="(val) => (query = val)" :show-unread="false" />
        <Tabs class="tabs" :tabs="tabs" :active="activeTab" @change="(val) => (activeTab = val)">
          <template #members>
            <TransitionGroup name="list-fade">
              <ManageMemberItem
                v-for="member in members"
                :key="member.id"
                :profile="member"
                @action="handleAction"
                :admin="isAdmin(member)"
                admin-control
              />
            </TransitionGroup>
          </template>
          <template #find>
            <ChatSearchList
              class="p-0"
              :query="query"
              :selected="selected"
              @select="handleSearchSelect"
              multiselect
            />
          </template>
        </Tabs>
      </div>
      <footer>
        <section class="controls">
          <Button
            @click="handleDismiss"
            :size="1.2"
            icon="cancel"
            icon-left
            :complementary="false"
            :disabled="isBusy"
          >
            Cancel
          </Button>
          <Button
            :disabled="!isDirty"
            @click="handleEdit"
            :size="1.2"
            icon="create"
            icon-left
            :busy="isBusy"
            accented
            async
          >
            Save
          </Button>
        </section>
      </footer>
    </aside>
  </Transition>
</template>

<style scoped>
.manage-members {
  position: fixed;
  z-index: 50;
  background-color: var(--c-background-0);
  width: 100vw;
  height: 100vh;
  top: 0;
  left: 0;
  box-shadow: 0 0 10px 0px var(--c-shadow-0);
  display: flex;
  flex-direction: column;
}
.manage-members header {
  position: sticky;
  top: 0;
  display: flex;
  padding: 1rem;
  border-bottom: 1px solid var(--c-border-1);
  background-color: var(--c-accent-light-3);
}
.manage-members header button {
  background-color: transparent;
}
.manage-members footer {
  padding: 1rem;
  border-top: 1px solid var(--c-border-2);
}
.manage-members footer .controls {
  text-align: right;
}
footer .controls button:not(:last-child) {
  margin-right: 1rem;
}

.container {
  flex: 1;
}
.container section {
  padding: 0 1rem;
}

.tabs {
  height: calc(100% - 3.25rem);
}
</style>
