<script setup>
import { watch, onBeforeUnmount, ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';

import { trapBetween, trapFocus } from '@/utils/utils';
import Button from '@/components/Common/Button/Button.vue';
import Link from '../Common/Link/Link.vue';

const props = defineProps({
  type: {
    type: String,
    default: 'existing'
  }
});

const emit = defineEmits(['back', 'open-search']);

const router = useRouter();
const el = ref(null);
const bound = ref(null);
const show = ref(false);
const hash = computed(() => (props.type === 'new' ? '#new-group' : '#manage'));

const keyListener = (event) => trapFocus(event, el.value, bound.value);

const handleDismiss = () => {
  if (show.value) {
    window.removeEventListener('keydown', keyListener);
    show.value = false;
    router.back();
  }
};
const handleLeave = () => emit('back');
const handleOpenSearch = () => {
  handleDismiss();
  emit('open-search');
};

let unregisterGuard = () => {};
watch(
  show,
  async (newVal, oldVal) => {
    if (oldVal !== newVal && newVal) {
      await router.push({ hash: hash.value });

      unregisterGuard = router.beforeEach((_to, from, next) => {
        if (from.hash === hash.value) {
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
        <h2 class="ml-1">{{ type === 'new' ? 'Create new group' : 'Manage Members' }}</h2>
      </header>
      <main>
        <section v-if="type === 'new'">
          Want to create a private chat ? Use <Link @click="handleOpenSearch">Search</Link>
        </section>
      </main>
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

.manage-members main {
  padding: 1rem 0 1rem 0;
  flex: 1;
}
.manage-members main section {
  padding: 0 1rem;
}
</style>
