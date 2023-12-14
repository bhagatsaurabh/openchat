<script setup>
import { watch, onBeforeUnmount, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { getSlug, trapBetween } from '@/utils/utils';
import Backdrop from '@/components/Common/Backdrop/Backdrop.vue';
import Icon from '@/components/Common/Icon/Icon.vue';
import Button from '@/components/Common/Button/Button.vue';

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  controls: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['dismiss', 'action']);

const router = useRouter();
const el = ref(null);
const queuedAction = ref(null);
const bound = ref(null);
const show = ref(false);

const trapFocus = (event) => {
  if (event.key === 'Tab') {
    if (!el.value.contains(document.activeElement)) {
      bound.value.first?.focus();
      return;
    }

    if (event.shiftKey) {
      if (document.activeElement === bound.value.first) {
        bound.value.last.focus();
        event.preventDefault();
      }
    } else {
      if (document.activeElement === bound.value.last) {
        bound.value.first.focus();
        event.preventDefault();
      }
    }
  }
};

const handleDismiss = () => {
  if (show.value) {
    window.removeEventListener('keydown', trapFocus);
    show.value = false;
    router.back();
  }
};
const handleAction = (control) => {
  if (queuedAction.value === null) {
    queuedAction.value = control;
    handleDismiss();
  }
};
const handleLeave = () => {
  queuedAction.value && emit('action', queuedAction.value);
  emit('dismiss');
};

let unregisterGuard = () => {};
watch(
  show,
  async (newVal, oldVal) => {
    if (oldVal !== newVal && newVal) {
      await router.push({ hash: getSlug(props.title) });

      unregisterGuard = router.beforeEach((_to, from, next) => {
        if (from.hash.startsWith('#pop')) {
          window.removeEventListener('keydown', trapFocus);
          emit('dismiss');
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
    window.addEventListener('keydown', trapFocus);
  }
});

onMounted(() => {
  document.activeElement?.blur();
  show.value = true;
});
onBeforeUnmount(unregisterGuard);
</script>

<template>
  <Backdrop :show="show" @dismiss="handleDismiss" />
  <Transition :duration="200" @after-leave="handleLeave" v-bind="$attrs" name="scale-fade">
    <div v-if="show" ref="el" class="modal" role="dialog">
      <Icon
        v-if="!controls.length"
        class="close-icon"
        alt="Close icon"
        name="close"
        adaptive
        @click="handleDismiss"
      />
      <h2 class="title">{{ title }}</h2>
      <div class="content">
        <slot></slot>
      </div>
      <div v-if="controls.length" class="controls">
        <Button v-for="control in controls" :key="control" @click="() => handleAction(control)" accented>
          {{ control }}
        </Button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal {
  position: fixed;
  z-index: 102;
  border: 1px solid var(--c-border-0);
  box-shadow: 0 0 10px 0px var(--c-shadow-0);
  left: 10vw;
  right: 10vw;
  top: 50vh;
  background-color: var(--c-background-2);
  transform: translateY(-50%);
  padding: 1rem;
  color: var(--c-text-0);
  transform-origin: center;
}

.modal .content {
  white-space: break-spaces;
  margin-bottom: 2rem;
}
.modal .title {
  font-weight: light;
  margin-bottom: 1rem;
  padding: 0 0.25rem;
}
.modal .controls {
  display: flex;
  justify-content: flex-end;
  column-gap: 1rem;
}
.close-icon {
  margin-left: calc(100% - 1.1rem);
  vertical-align: unset;
}
</style>
