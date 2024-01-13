<script setup>
import { watch, onBeforeUnmount, ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';

import { trapBetween, trapFocus } from '@/utils/utils';
import { useRemoteDBStore } from '@/stores/remote';
import { useStorageStore } from '@/stores/storage';
import { useGroupsStore } from '@/stores/groups';
import { useAuthStore } from '@/stores/auth';
import Button from '@/components/Common/Button/Button.vue';
import InputText from '@/components/Common/InputText/InputText.vue';
import AvatarSelector from '@/components/AvatarSelector/AvatarSelector.vue';
import Icon from '../Common/Icon/Icon.vue';
import Modal from '../Common/Modal/Modal.vue';

const emit = defineEmits(['leave', 'delete']);

const router = useRouter();
const remote = useRemoteDBStore();
const storage = useStorageStore();
const groups = useGroupsStore();
const auth = useAuthStore();
const el = ref(null);
const bound = ref(null);
const nameEl = ref(null);
const name = ref(null);
const editing = ref(false);
const group = computed(() => groups.activeGroup);
const isPrivate = computed(() => group.value.type === 'private');
const isAdmin = computed(() => !group.value.id === 'self' && group.value.admins.includes(auth.user.uid));
const showConfirm = ref(null);

const keyListener = (event) => trapFocus(event, el.value, bound.value);

const validateName = (val) => {
  if (!val) return 'Provide a name';
  if (!/^.[^!@#$%^&*()+={}[\]`~:;"?/<>]{3,}$/.test(val)) {
    return 'Enter a valid name';
  }
  return null;
};
const handleUpdate = async (field, args) => {
  if (field === 'name') {
    if (nameEl.value.validate(name.value)) return false;
    return await remote.updateGroup({ name: name.value }, group.value.id);
  } else if (field === 'avatar') {
    const { blob } = args;
    await storage.uploadFile(blob, `groups/${group.value.id}/profile.png`, { contentType: 'image/png' });
    const url = await storage.getUrl(`groups/${group.value.id}/profile.png`);
    await remote.updateGroup({ avatarUrl: url });
  }
  return false;
};
const handleControl = (action) => {
  showConfirm.value = { title: 'Leave group', action };
};

watch(el, () => {
  if (el.value) {
    bound.value = trapBetween(el.value);
    window.addEventListener('keydown', keyListener);
  }
});
onMounted(() => {
  document.activeElement?.blur();
  name.value = group.value.name;
});
onBeforeUnmount(() => window.removeEventListener('keydown', keyListener));
</script>

<template>
  <aside ref="el" class="group-profile">
    <Modal
      v-if="!!showConfirm"
      :title="showConfirm.title"
      :controls="['Yes', 'Cancel']"
      @dismiss="() => (showConfirm = null)"
      @action="(action) => action === 'Yes' && emit(showConfirm.action)"
    >
      Are you sure ?
    </Modal>
    <header>
      <Button @click="() => router.back()" :size="1.2" icon="back" :complementary="false" circular flat />
      <h2 class="ml-1">Profile</h2>
    </header>
    <main>
      <AvatarSelector
        :disabled="isPrivate"
        :url="group.avatarUrl"
        :updater="async (blob) => handleUpdate('avatar', { blob })"
      />
      <section class="name">
        <Transition name="fade-up">
          <div v-show="!editing" class="preview">
            <h2 class="fw-lighter ellipsis">{{ name }}</h2>
            <Button
              v-if="!isPrivate && isAdmin"
              class="mt-0p25 ml-0p5"
              :size="1"
              @click="editing = true"
              icon="edit"
              :complementary="false"
              circular
              flat
            />
          </div>
        </Transition>
        <Transition name="fade-down">
          <InputText
            class="w-100p"
            v-show="editing"
            ref="nameEl"
            type="text"
            placeholder="Name"
            v-model="name"
            :attrs="{ spellcheck: false, autocomplete: 'off', disabled: isPrivate }"
            :validator="validateName"
            :action="async () => await handleUpdate('name')"
            async
          />
        </Transition>
      </section>
      <section class="members">Members</section>
      <section class="controls">
        <Button @click="() => handleControl('leave')" icon="leave" :complementary="false" flat>Leave</Button>
        <Button @click="() => handleControl('delete')" icon="delete" :complementary="false" flat>
          Delete
        </Button>
      </section>
      <section class="promise">
        <Icon class="mr-0p5" name="badge-lock" alt="lock icon" adaptive />
        <span class="fw-lighter">Protected by end-to-end encryption and encryption-at-rest</span>
      </section>
    </main>
  </aside>
</template>

<style scoped>
.group-profile {
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

.group-profile section {
  padding-left: 1.5rem;
  padding-right: 1.5rem;
}

.group-profile header {
  position: sticky;
  top: 0;
  display: flex;
  padding: 1rem;
  border-bottom: 1px solid var(--c-border-1);
  background-color: var(--c-accent-light-3);
}
.group-profile header button {
  background-color: transparent;
}

.group-profile main {
  padding: 1rem 0 1rem 0;
  flex: 1;
}

.group-profile .info {
  display: flex;
  flex-direction: column;
}

.name {
  height: 5.125rem;
}
.name .preview {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  position: absolute;
  width: 100%;
  left: 0;
}

.members {
  margin-top: 1.5rem;
  border-top: 1px solid var(--c-border-1);
  padding-top: 1rem;
  padding-bottom: 1rem;
}

.controls {
  padding-bottom: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--c-border-1);
}
.controls button {
  font-size: 1rem;
  padding: 0.5rem 0;
  box-shadow: none !important;
  background-color: none !important;
  color: #ff6565;
}
.controls button:deep(.icon-container) {
  margin-right: 0.5rem;
  filter: invert(69%) sepia(28%) saturate(5520%) hue-rotate(319deg) brightness(100%) contrast(100%);
}

.promise {
  padding-top: 1rem;
  padding-bottom: 1rem;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}
.promise:deep(.icon-container) {
  margin-top: 0.2rem;
  font-size: 0;
  color: var(--c-text-2);
  filter: invert(77%) sepia(82%) saturate(2090%) hue-rotate(209deg) brightness(90%) contrast(88%);
}
</style>
