<script setup>
import { watch, onBeforeUnmount, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { trapBetween, trapFocus } from '@/utils/utils';
import Button from '@/components/Common/Button/Button.vue';
import ThemeSelector from '../Common/ThemeSelector/ThemeSelector.vue';

const emit = defineEmits(['back', 'logout', 'delete']);

const router = useRouter();
const el = ref(null);
const bound = ref(null);
const show = ref(false);

const keyListener = (event) => trapFocus(event, el.value, bound.value);

const handleDismiss = () => {
  if (show.value) {
    window.removeEventListener('keydown', keyListener);
    show.value = false;
    router.back();
  }
};
const handleLeave = () => emit('back');

let unregisterGuard = () => {};
watch(
  show,
  async (newVal, oldVal) => {
    if (oldVal !== newVal && newVal) {
      await router.push({ hash: '#settings' });

      unregisterGuard = router.beforeEach((_to, from, next) => {
        if (from.hash === '#settings') {
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

onMounted(() => {
  document.activeElement?.blur();
  show.value = true;
});
onBeforeUnmount(unregisterGuard);
</script>

<template>
  <Transition @after-leave="handleLeave" v-bind="$attrs" name="slide-left" appear>
    <aside v-if="show" ref="el" class="settings">
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
        <h2 class="ml-1">Settings</h2>
      </header>
      <main>
        <section class="theme">
          <h2 class="fw-lighter mb-1 pb-0p5 border-b-1">Theme</h2>
          <ThemeSelector />
        </section>
        <section class="controls">
          <h2 class="fw-lighter mb-1 pb-0p5 border-b-1">Account</h2>
          <Button
            class="control-logout"
            @click="emit('logout')"
            :size="1.2"
            icon="logout"
            :complementary="false"
            circular
            flat
          >
            <span class="ml-0p5">Log out</span>
          </Button>
          <Button
            class="control-delete"
            @click="emit('delete')"
            :size="1.2"
            icon="danger"
            :complementary="false"
            circular
            flat
          >
            <span class="ml-0p5">Delete account</span>
          </Button>
        </section>
      </main>
    </aside>
  </Transition>
</template>

<style scoped>
.settings {
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

.settings section {
  padding-left: 1.5rem;
  padding-right: 1.5rem;
}

.settings header {
  position: sticky;
  top: 0;
  display: flex;
  padding: 1rem;
  border-bottom: 1px solid var(--c-border-1);
  background-color: var(--c-accent-light-3);
}
.settings header button {
  background-color: transparent;
}

.settings main {
  padding: 1rem 0 1rem 0;
  flex: 1;
}

.settings .controls button {
  box-shadow: none !important;
  background-color: none !important;
  padding-left: 0;
  padding-right: 0;
}
.controls button {
  color: #ff6565;
}
.control-logout:deep(.icon-container) {
  filter: invert(69%) sepia(28%) saturate(5520%) hue-rotate(319deg) brightness(100%) contrast(100%);
}

.settings .theme {
  margin-bottom: 1.5rem;
  margin-top: 1.5rem;
}
</style>
