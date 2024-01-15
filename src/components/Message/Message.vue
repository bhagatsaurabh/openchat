<script setup>
import { computed, onMounted, ref } from 'vue';

import { useMessagesStore } from '@/stores/messages';
import { useUsersStore } from '@/stores/users';
import { useAuthStore } from '@/stores/auth';
import { useFilesStore } from '@/stores/files';
import { normalize } from '@/utils/utils';
import Spinner from '../Common/Spinner/Spinner.vue';
import Tail from '@/components/Common/Tail/Tail.vue';

const props = defineProps({
  message: Object,
  private: {
    type: Boolean,
    default: false
  }
});

const usersStore = useUsersStore();
const messagesStore = useMessagesStore();
const filesStore = useFilesStore();
const auth = useAuthStore();
const content = ref(null);
const state = ref(null);

const time = computed(() => props.message.timestamp.toTimeString().substring(0, 5));
const name = computed(() => usersStore.users[props.message.by].name);
const initials = computed(() =>
  usersStore.users[props.message.by].name
    .split(' ')
    .map((part) => part[0].toUpperCase())
    .join('')
);
const isSelf = computed(() => props.message.by === auth.user.uid);

const handleUploadTask = async (task) =>
  new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      (snapshot) => {
        state.value.progress = normalize(snapshot.bytesTransferred, 0, snapshot.totalBytes);
        if (snapshot.state === 'paused') state.value.stage = 'upload-paused';
        else if (snapshot.state === 'running') state.value.stage = 'uploading';
      },
      (error) => {
        handleUploadCancel(error);
        reject(error);
      },
      () => resolve()
    );
  });
const handleUploadCancel = (error) => {
  // TODO
  state.value.stage = 'failed';
  console.log(error);
};

onMounted(async () => {
  if (props.message.local) {
    content.value = props.message[props.message.type];
    // TODO: Load file ?
    const msg = { ...props.message };

    state.value = { stage: 'encrypting' };
    const data = await messagesStore.encrypt(props.message);
    if (props.message.type === 'text') {
      msg.text = data;
    } else {
      filesStore.addOriginalFile(content.value, props.message);
      await filesStore.saveFile(data, props.message);

      state.value = { stage: 'uploading', progress: 0 };
      const task = filesStore.upload(data.file, props.message);
      try {
        await handleUploadTask(task);
      } catch (error) {
        console.log(error);
        handleUploadCancel(error);
      }
      msg.text = data.iv;
    }
    state.value = null;
    messagesStore.pushToOutQueue(msg);
  } else {
    state.value = { stage: 'decrypting' };
    if (props.message.type === 'text') {
      content.value = await messagesStore.decrypt(props.message);
    } else {
      let data = await filesStore.getFile(props.message);
      let file;
      if (!data) {
        const iv = props.message.text;
        state.value = { stage: 'downloading' };
        const encryptedFile = await filesStore.download(props.message);
        await filesStore.saveFile({ iv, file: encryptedFile }, props.message);
        filesStore.addEncryptedFile({ iv, file: encryptedFile }, props.message);
      }
      state.value = { stage: 'decrypting' };
      file = await messagesStore.decrypt(props.message);
      content.value = file;
    }
    state.value = null;
  }
});
</script>

<template>
  <div class="message" :class="{ me: isSelf }">
    <div class="container">
      <div v-if="!content" class="suspense">
        <Spinner />
      </div>
      <template v-else>
        <div v-if="!isSelf" class="avatar">
          <img
            v-if="usersStore.users[message.by]?.avatarUrl"
            alt="avatar icon"
            :src="usersStore.users[message.by].avatarUrl"
          />
          <span class="initials" v-else>{{ initials }}</span>
          <h3 class="name">{{ name }}</h3>
        </div>
        <div class="content">
          <span class="tail">
            <Tail />
          </span>
          <span class="data">{{ content }}</span>
          <h5 class="time">{{ time }}</h5>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.message {
  width: 100%;
  margin-bottom: 1rem;
  display: flex;
}
.message .container {
  max-width: 75vw;
  min-width: 25vw;
}
.message.me .container {
  margin-right: 0.75rem;
  margin-left: auto;
}

.message .content {
  background-color: var(--c-accent-light-4);
  box-shadow: 3px 3px 6px -3px var(--c-text-0);
  border-radius: 0.5rem;
  padding: 0.25rem 0.5rem 0.25rem 0.5rem;
  border-top-right-radius: unset;
}
.message .content .tail {
  position: absolute;
  top: 0;
  right: 0;
  color: var(--c-accent-light-4);
  font-size: 0;
  right: 0;
  transform: translateX(100%);
}

.message .content::after {
  content: '';
  position: absolute;
  display: block;
  width: 6px;
  background: transparent;
  height: 6px;
  z-index: -1;
  box-shadow: 3px 3px 5px 0px var(--c-text-1);
  top: 0;
  right: -2px;
}

.message .content .time {
  color: var(--c-text-2);
  text-align: right;
}
</style>
