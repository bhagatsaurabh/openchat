<script setup>
import { watch, onBeforeUnmount, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { trapBetween, trapFocus } from '@/utils/utils';
import { useGroupsStore } from '@/stores/groups';
import Button from '@/components/Common/Button/Button.vue';
import Link from '../Common/Link/Link.vue';
import Tabs from '@/components/Common/Tabs/Tabs.vue';
import ManageMemberItem from '@/components/ManageMemberItem/ManageMemberItem.vue';
import ChatSearch from '../ChatSearch/ChatSearch.vue';
import ChatSearchList from '@/components/ChatSearchList/ChatSearchList.vue';
import InputText from '../Common/InputText/InputText.vue';
import { nameRegex } from '@/utils/constants';
import { useAuthStore } from '@/stores/auth';

const emit = defineEmits(['back', 'open-search']);

const router = useRouter();
const groupsStore = useGroupsStore();
const auth = useAuthStore();
const el = ref(null);
const bound = ref(null);
const show = ref(false);
const query = ref('');
const searchEl = ref(null);
const tabs = ref([
  { name: 'Members', id: 'members', icon: 'members', count: 0 },
  { name: 'Find', id: 'find', icon: 'search' }
]);
const activeTab = ref(1);
const members = ref([]);
const memberIds = ref(new Set());
const nameEl = ref(null);
const name = ref(null);
const orgCount = ref(members.value.length);
const isBusy = ref(false);

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
const handleOpenSearch = () => {
  if (isBusy.value) return;
  handleDismiss();
  emit('open-search');
};
const handleCreate = async () => {
  if (nameEl.value.validate(name.value)) return;

  isBusy.value = true;
  const id = await groupsStore.createGroup({
    name: name.value,
    type: 'broadcast',
    members: [auth.profile, ...members.value]
  });
  await groupsStore.setActiveGroup(id);
  router.push({ path: '/chat' });
  isBusy.value = false;
};
const handleSearchSelect = (otherUser) => {
  if (isBusy.value) return;
  if (!memberIds.value.has(otherUser.id)) {
    members.value.push(otherUser);
    memberIds.value.add(otherUser.id);
  } else {
    members.value.splice(
      members.value.findIndex((m) => m.id === otherUser.id),
      1
    );
    memberIds.value.delete(otherUser.id);
  }
  tabs.value[0].count = members.value.length - orgCount.value;
  if (!members.value.length) {
    activeTab.value = 1;
  }
};
const handleAction = (action, user) => {
  if (action === 'remove') handleSearchSelect(user);
};
const validateName = (val) => {
  if (!val) return 'Provide a name';
  if (!nameRegex.test(val)) {
    return 'Enter a valid name';
  }
  return null;
};

let unregisterGuard = () => {};
watch(
  show,
  async (newVal, oldVal) => {
    if (oldVal !== newVal && newVal) {
      await router.push({ hash: '#new-group' });
      searchEl.value.focus();

      unregisterGuard = router.beforeEach((_to, from, next) => {
        if (from.hash === '#new-group') {
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
watch(query, () => (activeTab.value = 1));

onMounted(() => {
  document.activeElement?.blur();
  show.value = true;
});
onBeforeUnmount(unregisterGuard);
</script>

<template>
  <Transition @after-leave="handleLeave" v-bind="$attrs" name="slide-right" appear>
    <aside v-if="show" ref="el" class="container">
      <header>
        <Button
          class="mt-0p1"
          @click="handleDismiss"
          :size="1.2"
          icon="back"
          :complementary="false"
          :adaptive="false"
          circular
          flat
        />
        <h2 class="ml-1 c-black">Create new group</h2>
      </header>
      <section class="name-input">
        <InputText
          ref="nameEl"
          type="text"
          placeholder="Name"
          v-model="name"
          :attrs="{ spellcheck: false, autocomplete: 'off' }"
          :validator="validateName"
        />
      </section>
      <div class="members">
        <ChatSearch ref="searchEl" @search="(val) => (query = val)" :show-unread="false" />
        <Tabs
          class="tabs"
          :tabs="tabs"
          :active="activeTab"
          :show-header="members.length > 0"
          @change="(val) => (activeTab = val)"
        >
          <template #members>
            <TransitionGroup name="list-fade">
              <ManageMemberItem
                v-for="member in members"
                :key="member.id"
                :profile="member"
                @action="handleAction"
              />
            </TransitionGroup>
          </template>
          <template #find>
            <ChatSearchList
              class="p-0"
              :query="query"
              :selected="memberIds"
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
            :disabled="members.length < 2 || !name"
            @click="handleCreate"
            :size="1.2"
            icon="create"
            icon-left
            :busy="isBusy"
            accented
            async
          >
            Create
          </Button>
        </section>
        <section class="mt-1">
          Want to create a private chat ? Use <Link @click="handleOpenSearch">Search</Link>
        </section>
      </footer>
    </aside>
  </Transition>
</template>

<style scoped>
.container {
  position: fixed;
  z-index: 55;
  background-color: var(--c-background-0);
  width: 100vw;
  height: 100vh;
  top: 0;
  left: 0;
  box-shadow: 0 0 10px 0px var(--c-shadow-0);
  display: flex;
  flex-direction: column;
}
.container header {
  position: sticky;
  top: 0;
  display: flex;
  padding: 1rem;
  border-bottom: 1px solid var(--c-border-1);
  background-color: var(--c-accent-light-3);
}
.container header button {
  background-color: transparent;
}
.container footer {
  padding: 1rem;
  border-top: 1px solid var(--c-border-2);
}
.container footer .controls {
  text-align: right;
}
footer .controls button:not(:last-child) {
  margin-right: 1rem;
}

.members {
  flex: 1;
}
.members section {
  padding: 0 1rem;
}

.tabs {
  height: calc(100% - 3.25rem);
}

.name-input {
  padding: 0 1rem;
}
.name-input:deep(.input) {
  width: 100%;
}

@media (min-width: 768px) {
  .container {
    width: 390px;
    left: unset;
    right: 0;
  }
}
@media (min-width: 1024px) {
  .container {
    width: 425px;
    left: unset;
    right: 0;
  }
}
</style>
