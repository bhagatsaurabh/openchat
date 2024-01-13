<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';

import {
  throttle,
  getImageDimensions,
  resizeImage,
  distance,
  clamp,
  normalize,
  denormalize
} from '@/utils/utils';
import { useNotificationStore } from '@/stores/notification';
import Button from '@/components/Common/Button/Button.vue';
import Icon from '@/components/Common/Icon/Icon.vue';

const props = defineProps({
  url: {
    type: String,
    default: null
  },
  updater: {
    type: Function,
    default: () => {}
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const notify = useNotificationStore();
const size = ref(0);
const pos = ref({ x: 0, y: 0 });
const image = ref(null);
const el = ref(null);
const inputEl = ref(null);
const previewEl = ref(null);
const isEditing = ref(false);
const updating = ref(false);

const handleResize = (entries) => {
  const rect = entries[0].target.getBoundingClientRect();
  pos.value = { x: rect.x, y: rect.y };
  const { width } = entries[0].contentRect;
  if (width === size.value) return;

  size.value = Math.floor(width);
};
const throttledhandleResize = throttle(handleResize, 150);

const handleSelect = async (e) => {
  if (!e.target.files[0]) return;

  let message = null;
  if (!e.target.files[0]?.type.startsWith('image/')) message = 'File is not an image';
  let dims;
  if (!message) {
    const { img, width, height } = await getImageDimensions(e.target.files[0]);
    image.value = img;
    dims = { width, height };
    if (width < 128 || height < 128) message = 'Selected image is too small (less than 128px)';
  }

  if (message) {
    notify.push({ type: 'snackbar', status: 'warn', message });
    return;
  } else {
    if (dims.width > 500 || dims.height > 500) {
      image.value = await resizeImage(e.target.files[0], 500, 500 * (dims.height / dims.width));
    }

    isEditing.value = true;
    e.target.value = '';
    await nextTick(() => computeLimits());
  }
};

const pointers = [];
let prevPinchDist = -1;
let currScale = 1;
let delta = { x: 0, y: 0 };
let maxScale = 2;
let reference = null;
let limits = { x: 0, y: 0 };
const handlePointerDown = (e) => {
  if (!isEditing.value) return;
  e.preventDefault();
  pointers.push({ id: e.pointerId, x: e.pageX - pos.value.x, y: e.pageY - pos.value.y });

  if (pointers.length === 1)
    reference = {
      x: pointers[0].x - delta.x,
      y: pointers[0].y - delta.y
    };
  else if (pointers.length > 1) reference = null;
};
const handlePointerUp = (e) => {
  if (!isEditing.value) return;
  pointers.splice(
    pointers.findIndex((pntr) => pntr.id === e.pointerId),
    1
  );

  if (pointers.length < 2) prevPinchDist = -1;
  if (pointers.length === 0) reference = null;
};
const handlePointerMove = (e) => {
  if (!isEditing.value) return;
  e.preventDefault();
  const pntr = pointers.find((pntr) => pntr.id === e.pointerId);
  pntr.x = e.pageX - pos.value.x;
  pntr.y = e.pageY - pos.value.y;

  if (pointers.length === 2) {
    let currPinchDist = distance(pointers[0], pointers[1]);
    if (prevPinchDist > 0) {
      if (currPinchDist !== prevPinchDist) {
        handleZoom(currPinchDist > prevPinchDist, 1.02);
      }
    }
    prevPinchDist = currPinchDist;
  } else if (pointers.length === 1) {
    delta = {
      x: Math.floor(clamp(pointers[0].x - reference.x, limits.x)),
      y: Math.floor(clamp(pointers[0].y - reference.y, limits.y))
    };
    updateTransform();
  }
};
const handleZoom = (zoomIn, delta) => {
  if (!isEditing.value) return;
  const newScale = currScale * (zoomIn ? delta : 1 / delta);
  if ((newScale >= maxScale && zoomIn) || (newScale <= 1 && !zoomIn)) return;
  currScale = newScale;

  updateTransform();
};
const updateTransform = () => {
  computeLimits();
  previewEl.value.style.transform = `translateY(-50%) translate(${delta.x}px, ${delta.y}px) scale(${currScale})`;
};
const computeLimits = () => {
  const xAmount = Math.floor((size.value - previewEl.value.clientWidth * currScale) / 2);
  const yAmount = Math.floor((size.value - previewEl.value.clientHeight * currScale) / 2);
  limits = {
    x: [-xAmount, xAmount],
    y: [-yAmount, yAmount]
  };
};

const handleReset = () => {
  image.value = null;
  prevPinchDist = -1;
  currScale = 1;
  delta = { x: 0, y: 0 };
  reference = null;
  limits = { x: 0, y: 0 };
  isEditing.value = false;
};
const handleUpdate = () => {
  if (!isEditing.value) return;

  const canvas = document.createElement('canvas');
  canvas.width = image.value.width;
  canvas.height = image.value.width;
  const ctx = canvas.getContext('2d');
  ctx.transform(
    currScale,
    0,
    0,
    currScale,
    denormalize(normalize(delta.x, 0, size.value), 0, canvas.width) - (canvas.width / 2) * (currScale - 1),
    denormalize(normalize(delta.y, 0, size.value), 0, canvas.height) - (canvas.width / 2) * (currScale - 1)
  );
  ctx.drawImage(image.value, 0, (canvas.height - image.value.height) / 2, canvas.width, image.value.height);
  canvas.toBlob(async (blob) => {
    updating.value = true;
    await props.updater(blob);
    updating.value = false;
    handleReset();
  });
};

let observer;
onMounted(() => {
  observer = new ResizeObserver(throttledhandleResize);
  observer.observe(el.value);
});
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <section class="avatar-selector" :class="{ disabled }">
    <div
      ref="el"
      :style="{ height: `${size}px` }"
      class="container"
      :class="{ editing: isEditing }"
      @pointerdown="handlePointerDown"
      @pointerup="handlePointerUp"
      @pointermove="handlePointerMove"
      @pointerout="handlePointerUp"
      @wheel="(e) => handleZoom(e.deltaY < 0, 1.05)"
    >
      <img
        v-if="!isEditing"
        class="avatar"
        :class="{ default: !url }"
        :src="url ? url : '/assets/images/avatar.png'"
      />
      <img v-if="isEditing" ref="previewEl" class="preview" :src="image.src" />
      <div v-if="isEditing" class="mask"></div>
      <div @click="inputEl.click()" v-if="!isEditing" class="change-control" tabindex="0">
        <Icon name="camera" :size="1.5" alt="camera-icon" adaptive invert />
        <h3>Select Profile Picture</h3>
      </div>
    </div>
    <div v-hide="!isEditing" class="controls">
      <Button
        :tabindex="isEditing ? 0 : -1"
        @click="handleUpdate"
        :complementary="false"
        :busy="updating"
        async
      >
        Update Photo
      </Button>
      <Button
        v-if="isEditing"
        @click="handleReset"
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
  margin: 1rem 0 1rem 0;
}
.avatar-selector.disabled {
  pointer-events: none;
}
.avatar-selector .container {
  touch-action: none;
  width: 70%;
  overflow: hidden;
  transition: transform var(--fx-transition-duration-2) ease;
  transform: translateY(1.5rem);
}
.avatar-selector .container.editing {
  transform: translateY(0);
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
.avatar-selector.disabled .container .change-control:deep(.icon-container img) {
  pointer-events: none !important;
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
  border: 1px solid var(--c-border-1);
  border-radius: 50%;
}
.avatar-selector .container .avatar.default {
  padding: 2rem;
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

.avatar-selector .container .preview {
  position: absolute;
  width: 100%;
  transform-origin: center;
  transform: translateY(-50%);
  top: 50%;
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
