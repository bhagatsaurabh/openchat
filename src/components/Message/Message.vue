<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

import { useMessagesStore } from '@/stores/messages';
import { useUsersStore } from '@/stores/users';
import { useAuthStore } from '@/stores/auth';
import { useFilesStore } from '@/stores/files';
import { normalize, getIconFromFileType } from '@/utils/utils';
import Spinner from '../Common/Spinner/Spinner.vue';
import Tail from '@/components/Common/Tail/Tail.vue';
import ProgressBar from '../Common/ProgressBar/ProgressBar.vue';
import Button from '../Common/Button/Button.vue';

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
const contentType = ref(null);
const imgLoaded = ref(false);
const state = ref({ stage: 'pending' });
const objUrl = ref(null);
const isSystem = ref(props.message.by === 'system');

const time = computed(() => props.message.timestamp.toTimeString().substring(0, 5));
const name = computed(() => usersStore.users[props.message.by]?.name);
const initials = computed(() =>
  name.value
    ? name.value
        .split(' ')
        .map((part) => part[0].toUpperCase())
        .join('')
    : '?'
);
const isSelf = computed(() => props.message.by === auth.user.uid);
const avatarUrl = computed(() => usersStore.users[props.message.by]?.avatarUrl);

let uploadTask;
const handleUploadTask = async (task) => {
  uploadTask = task;
  return new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      (snapshot) => {
        state.value.progress = normalize(snapshot.bytesTransferred, 0, snapshot.totalBytes);
        if (snapshot.state === 'paused') state.value = { stage: 'paused', progress: -2, icon: 'upload' };
        else if (snapshot.state === 'running')
          state.value = { stage: 'uploading', progress: state.value.progress, icon: 'pause' };
      },
      (error) => {
        reject(error);
      },
      () => {
        uploadTask = null;
        resolve();
      }
    );
  });
};
const handleUploadCancel = () => {
  state.value = { stage: 'failed', progress: -2, icon: 'retry' };
  // Fallback tasks ?
};
const handlePreview = () => {
  if (state.value.stage !== 'previewing') return;

  let type = 'text';
  if (props.message.type === 'file') {
    type = content.value.type.substring(0, content.value.type.indexOf('/'));
    if (!['image', 'audio', 'video'].includes(type)) type = 'document';
    objUrl.value = URL.createObjectURL(content.value);
  }
  if (type !== 'image') {
    // No need to wait for loading of streamed or non-previewable content
    state.value = { stage: 'done' };
  }
  contentType.value = type;
};
const handleStateAction = async () => {
  if (state.value.stage === 'uploading') uploadTask?.pause();
  else if (state.value.stage === 'paused') uploadTask?.resume();
  else if (state.value.stage === 'failed') {
    await handleLocalMessage();
  }
};
const handleImageLoaded = () => {
  imgLoaded.value = true;
  state.value = { stage: 'done' };
};
let downloader = null;
const handleDocDownload = () => {
  if (!downloader) {
    downloader = document.createElement('a');
    downloader.href = objUrl.value;
    downloader.download = content.value.name;
  }
  downloader.click();
};
const handleLocalMessage = async () => {
  content.value = props.message[props.message.type];
  const msg = { ...props.message };

  state.value = { stage: 'encrypting', progress: -1, icon: 'lock' };
  const data = await messagesStore.encrypt(props.message);
  if (props.message.type === 'text') {
    msg.text = data;
    contentType.value = 'text';
    state.value = { stage: 'done' };
  } else {
    filesStore.addOriginalFile(content.value, props.message);
    await filesStore.saveFile(data, props.message);

    if (props.message.groupId !== 'self') {
      state.value = { stage: 'uploading', progress: 0, icon: 'pause' };
      const task = await filesStore.upload(data.file, props.message);
      try {
        await handleUploadTask(task);
      } catch (error) {
        console.log(error);
        handleUploadCancel(error);
        return;
      }
    }
    msg.text = data.iv;
    state.value = { stage: 'previewing', progress: -1, icon: getIconFromFileType(props.message.file.type) };
  }
  messagesStore.pushToOutQueue(msg);
};
const handleRemoteMessage = async () => {
  state.value = { stage: 'decrypting', progress: -1, icon: 'lock' };
  if (props.message.type === 'text') {
    content.value = await messagesStore.decrypt(props.message);
    contentType.value = 'text';
    state.value = { stage: 'done' };
  } else {
    let data = await filesStore.getFile(props.message);
    let file;
    if (!data) {
      const iv = props.message.text;
      state.value = { stage: 'downloading', progress: -1, icon: 'download' };
      const encryptedFile = await filesStore.download(props.message);
      await filesStore.saveFile({ iv, file: encryptedFile }, props.message);
      filesStore.addEncryptedFile({ iv, file: encryptedFile }, props.message);
    }
    state.value = { stage: 'decrypting', progress: -1, icon: 'lock' };
    file = await messagesStore.decrypt(props.message);
    await messagesStore.updateSync(props.message);
    content.value = file;
    state.value = { stage: 'previewing', progress: -1, icon: getIconFromFileType(content.value.type) };
  }
};

onMounted(async () => {
  if (props.message.by === 'system') {
    content.value = props.message.text;
    contentType.value = 'text';
    state.value = { stage: 'done' };
  } else {
    if (props.message.local) await handleLocalMessage();
    else await handleRemoteMessage();
    handlePreview();
  }
});
onBeforeUnmount(() => {
  if (objUrl.value) URL.revokeObjectURL(objUrl.value);
});
</script>

<template>
  <div class="message" :class="{ me: isSelf }">
    <div v-if="!isSystem" class="container">
      <div v-if="state.stage === 'pending'" class="suspense">
        <Spinner />
      </div>
      <template v-else>
        <div v-if="!isSelf" class="avatar">
          <img class="avatar-img" v-if="avatarUrl" alt="avatar icon" :src="avatarUrl" />
          <div class="initials" v-else>{{ initials }}</div>
        </div>
        <div class="content">
          <h4 class="name">{{ name }}</h4>
          <span class="tail"><Tail :self="message.by === auth.user.uid" /></span>
          <div class="state" v-if="state.stage !== 'done'">
            <ProgressBar v-if="state.progress !== -2" class="progress" :value="state.progress" />
            <Button
              :size="1.2"
              @click="handleStateAction"
              :icon="state.icon"
              :complementary="false"
              circular
              flat
            />
          </div>
          <span v-if="contentType === 'text'" class="text">{{ content }}</span>
          <audio v-if="contentType === 'audio' && !!objUrl" class="audio" controls>
            <source :src="objUrl" />
          </audio>
          <video v-if="contentType === 'video' && !!objUrl" class="video" controls>
            <source :src="objUrl" />
          </video>
          <div v-if="contentType === 'document' && !!objUrl" class="document">
            <Button
              class="doc-control"
              @click="handleDocDownload"
              icon="document"
              :complementary="false"
              flat
            >
              <h4 class="ellipsis">{{ content.name }}</h4>
            </Button>
          </div>
          <img
            v-if="contentType === 'image' && !!objUrl"
            :style="{ width: imgLoaded ? 'auto' : 0, height: imgLoaded ? 'auto' : 0 }"
            class="image"
            :src="objUrl"
            @load="handleImageLoaded"
          />
          <h5 class="time">{{ time }}</h5>
        </div>
      </template>
    </div>
    <div v-else class="container sys">
      <div class="sys-content">
        <span tabindex="0" v-if="contentType === 'text'" class="text">{{ content }}</span>
        <h5 class="time">{{ time }}</h5>
      </div>
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
  margin-right: auto;
  margin-left: 3rem;
}
.message .container.sys {
  margin-left: auto;
  margin-right: auto;
}
.message.me .container {
  margin-right: 0.75rem;
  margin-left: auto;
}
.sys-content {
  text-align: center;
  margin-top: 1rem;
}
.sys-content .text {
  font-weight: lighter;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  background-color: var(--c-accent-light-3);
}
.sys-content .text:focus + .time {
  transform: translateY(0);
}
.sys-content .time {
  margin-top: 0.25rem;
  font-weight: lighter;
  transform: translateY(-120%);
  z-index: -1;
  transition: transform var(--fx-transition-duration-1) ease;
}
.message .content {
  background-color: var(--c-accent-light-4);
  box-shadow: 3px 3px 6px -3px var(--c-text-0);
  border-radius: 0.5rem;
  padding: 0.25rem 0.5rem 0.25rem 0.5rem;
  border-top-left-radius: unset;
}
.message.me .content {
  border-top-right-radius: unset;
}
.message .content .tail {
  position: absolute;
  top: 0;
  left: 0;
  transform: translateX(-100%);
  color: var(--c-accent-light-4);
  font-size: 0;
}
.message.me .content .tail {
  right: 0;
  left: unset;
  transform: translateX(100%);
}
.message.me .content::after {
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
  float: right;
  position: relative;
  font-size: 0.7rem;
  top: 0.65rem;
  left: 0.2rem;
  margin-left: 0.25rem;
}
.message .content .name {
  font-size: 0.85rem;
  font-weight: lighter;
}

.message .avatar {
  position: absolute;
  left: -2.5rem;
  width: 1.75rem;
  height: 1.75rem;
}
.message .avatar .initials {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid var(--c-border-2);
  border-radius: 1rem;
  font-weight: bold;
}
.message .avatar .avatar-img {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 1rem;
}

.state {
  width: 5rem;
  height: 5rem;
  margin-top: 0.25rem;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-left: auto;
  margin-right: auto;
}
.state .progress {
  position: absolute;
  width: 50%;
  height: 50%;
}
.state button {
  background-color: transparent !important;
  box-shadow: none !important;
}

.content .text {
  font-size: 1rem;
}
.content .image {
  max-width: 100%;
  max-height: 12rem;
}
.content .audio {
  max-width: calc(75vw - 1rem);
  margin-top: 0.25rem;
}
.content .video {
  max-width: min(calc(75vw - 1rem), 25rem);
  margin-top: 0.25rem;
}
.content .document {
  max-width: min(calc(75vw - 1rem), 25rem);
  margin-top: 0.25rem;
}
.content .document .doc-control {
  width: 100%;
  padding: 0.5rem;
  border-radius: 0;
  background: transparent;
  border: 1px solid var(--c-border-2);
}
.content .document .doc-control:deep(.icon-container) {
  margin-right: 0.25rem;
}

@media (hover: hover) {
  .sys-content .text:hover + .time {
    transform: translateY(0);
  }
}
</style>
