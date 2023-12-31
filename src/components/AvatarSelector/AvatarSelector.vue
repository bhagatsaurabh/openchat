<script setup>
import { onBeforeMount, onMounted, ref } from 'vue';

import { throttle, getImageDimensions, resizeImage } from '@/utils/utils';
import { useNotificationStore } from '@/stores/notification';
import Button from '@/components/Common/Button/Button.vue';
import Icon from '@/components/Common/Icon/Icon.vue';

defineProps({
  url: {
    type: String,
    default: null
  }
});

const notify = useNotificationStore();
const size = ref(0);
const el = ref(null);
const isEditing = ref(false);
const updating = ref(false);
const inputEl = ref(null);
const canvasEl = ref(null);

const handleResize = (entries) => {
  const { width } = entries[0].contentRect;
  if (width === size.value) return;

  size.value = Math.floor(width);
};
const throttledhandleResize = throttle(handleResize, 150);

const handleSelect = async (e) => {
  if (!e.target.files[0]) return;

  let message = null;
  if (!e.target.files[0]?.type.startsWith('image/')) message = 'File is not an image';
  let dims, image;
  if (!message) {
    const { img, width, height } = await getImageDimensions(e.target.files[0]);
    image = img;
    dims = { width, height };
    if (width < 128 || height < 128) message = 'Selected image is too small (less than 128px)';
  }

  if (message) {
    notify.push({ type: 'snackbar', status: 'warn', message });
    return;
  } else {
    if (dims.width > 500 || dims.height > 500) {
      const resizedBitmap = await resizeImage(e.target.files[0], 500, 500 * (dims.height / dims.width));
      console.log(
        resizedBitmap.width,
        resizedBitmap.height,
        size.value,
        (500 - resizedBitmap.width) / 2,
        (size.value - resizedBitmap.height) / 2
      );
      canvasEl.value
        .getContext('2d')
        .drawImage(
          resizedBitmap,
          (500 - resizedBitmap.width) / 2,
          (size.value * (1 - dims.height / dims.width)) / 2,
          size.value,
          size.value * (dims.height / dims.width)
        );
    } else {
      canvasEl.value
        .getContext('2d')
        .drawImage(image, 0, 0, size.value, size.value * (dims.height / dims.width));
    }
    isEditing.value = true;
    e.target.value = '';
  }
};
const handleCancel = () => (isEditing.value = false);
const handleUpdate = () => {};

let observer;
onMounted(() => {
  observer = new ResizeObserver(throttledhandleResize);
  observer.observe(el.value);
});
onBeforeMount(() => observer?.disconnect());
</script>

<template>
  <section class="avatar-selector">
    <div ref="el" :style="{ height: `${size}px` }" class="container">
      <img v-if="!isEditing" class="avatar" :src="url ?? '/assets/images/avatar.png'" />
      <canvas ref="canvasEl" v-show="isEditing" :width="size" :height="size"></canvas>
      <div v-if="isEditing" class="mask"></div>
      <div @click="inputEl.click()" v-if="!isEditing" class="change-control" tabindex="0">
        <Icon name="camera" :size="1.5" alt="camera-icon" adaptive invert />
        <h3>Select Profile Picture</h3>
      </div>
    </div>
    <div v-hide="!isEditing" class="controls">
      <Button @click="handleUpdate" :complementary="false" :busy="updating" async>Update Photo</Button>
      <Button
        v-if="isEditing"
        @click="handleCancel"
        :size="1"
        class="close-control"
        icon="close"
        :complementary="false"
        circular
      />
    </div>
    <input v-show="false" ref="inputEl" type="file" accept="image/*" @change="handleSelect" />
  </section>
</template>

<style scoped>
.avatar-selector {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 2rem 0 1rem 0;
}
.avatar-selector .container {
  width: 70%;
}
.avatar-selector .container .change-control {
  display: flex;
  flex-direction: column;
  border-radius: 50%;
  opacity: 0;
  transition: opacity var(--fx-transition-duration-0) linear;
  user-select: none;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
  background-color: var(--c-text-2);
  color: var(--c-background-0);
}
.avatar-selector .container .change-control:focus {
  opacity: 0.75;
}
.avatar-selector .container .avatar {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  padding: 2rem;
  border: 1px solid var(--c-border-1);
  border-radius: 50%;
}
.avatar-selector .container .mask {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  user-select: none;
  background-color: #888a;
  mask-image: url(/assets/images/avatar-mask.svg);
}

.avatar-selector .controls {
  display: flex;
  align-items: center;
  column-gap: 1rem;
  margin-top: 1rem;
}

@media (hover: hover) {
  .avatar-selector .container .change-control:hover {
    opacity: 0.75;
    cursor: pointer;
  }
}
</style>
