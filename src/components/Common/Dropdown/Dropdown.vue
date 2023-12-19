<script setup>
import { computed, nextTick, ref, toRaw, watch } from 'vue';
import Backdrop from '@/components/Common/Backdrop/Backdrop.vue';
import InputText from '../InputText/InputText.vue';

const props = defineProps({
  open: Boolean,
  items: Array,
  itemKey: String,
  itemComponent: Object,
  itemAttributes: Function,
  selected: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['select', 'dismiss']);

const search = ref('');
const el = ref(null);
const listEl = ref(null);
const searchEl = ref(null);
const selected = ref(
  props.items?.find((item) => item[props.itemKey] === props.selected[props.itemKey])
    ? props.selected
    : props.items[0]
);
const selectedIdx = computed(() =>
  filteredItems.value.findIndex((item) => item[props.itemKey] === selected.value[props.itemKey])
);
const filteredItems = computed(() =>
  props.items.filter((item) => item[0].toLocaleLowerCase().includes(search.value.toLocaleLowerCase()))
);

const handleKey = (e) => {
  if (props.open && ['ArrowUp', 'ArrowDown'].includes(e.code)) {
    let idx = selectedIdx.value;
    if (filteredItems.value.length === 0) return;
    if (!filteredItems.value.includes(toRaw(selected.value))) {
      idx = 0;
    }

    if (e.code === 'ArrowUp') {
      idx -= 1;
    } else if (e.code === 'ArrowDown') {
      idx += 1;
    }
    const item =
      filteredItems.value[
        (idx < 0 ? filteredItems.value.length - Math.abs(idx) : idx) % filteredItems.value.length
      ];

    handleSelect(item, false);
  }
};
const handleSelect = (item, dismiss = true) => {
  selected.value = item;
  dismiss && emit('dismiss');
};
const handleScroll = async () => {
  if (filteredItems.value.length === 0) return;
  await nextTick();
  listEl.value?.children[selectedIdx.value].scrollIntoView({
    behavior: 'instant',
    block: 'center'
  });
};

watch(selected, () => {
  handleScroll();
  emit('select', selected.value);
});
watch(
  () => props.open,
  () => {
    if (props.open) {
      search.value = '';
      handleScroll();
      searchEl.value?.native.focus();
    }
  }
);
</script>

<template>
  <Backdrop :show="open" @dismiss="emit('dismiss')" clear />
  <section v-bind="$attrs" tabindex="0" ref="el" @keydown="handleKey" class="dropdown" :class="{ open }">
    <InputText
      ref="searchEl"
      class="search-input"
      v-model="search"
      type="text"
      placeholder="Search"
      :attrs="{ spellcheck: false }"
      no-title
      validation="Off"
    />
    <ul ref="listEl" class="scroll-shadows scroll-shadows-2">
      <li class="not-found" v-if="filteredItems.length === 0">
        <span>Found no match for&nbsp;</span><span class="query">{{ search }}</span>
      </li>
      <li
        tabindex="0"
        v-for="item in filteredItems"
        :key="item[itemKey]"
        :class="{ selected: item[itemKey] === selected[itemKey] }"
        @keydown.enter="() => handleSelect(item)"
        @click="() => handleSelect(item)"
      >
        <component :is="itemComponent" v-bind="itemAttributes?.(item)" />
      </li>
    </ul>
  </section>
</template>

<style scoped>
.dropdown {
  position: absolute;
  z-index: 101;
  top: 100%;
  background-color: var(--c-background-2);
  max-height: 0vh;
  overflow: hidden;
  transition:
    max-height var(--fx-transition-duration-2) ease,
    clip-path var(--fx-transition-duration-1) ease;
  clip-path: polygon(0% 0%, 0% 0%, 0% 0%, 0% 0%);
  box-shadow: 2px 2px 4px 0px var(--c-shadow-0);
  pointer-events: none;
  width: calc(100vw - 2rem) !important;
}
.dropdown.open {
  max-height: 39vh;
  clip-path: polygon(0% 0%, 105% 0%, 105% 105%, 0% 105%);
  pointer-events: all;
}

.dropdown ul {
  list-style: none;
  padding: 0.5rem;
  max-height: calc(39vh - 2rem);
  user-select: none;
  margin-top: 2rem;
}
.dropdown ul li {
  display: flex;
  justify-content: space-between;
  width: calc(100% - 2px);
  padding: 0.5rem;
}
.dropdown ul li.selected {
  background-color: #c18eda75 !important;
  box-shadow: 0px 0px 2px 0px;
}

.search-input {
  position: absolute;
  z-index: 1;
  width: 100%;
  padding-left: 1rem;
  padding-right: 1rem;
  background-color: var(--c-background-2);
}
.not-found {
  padding: 1rem;
  display: flex;
  justify-content: center !important;
  align-items: center;
  color: var(--c-text-2);
}
.not-found span {
  white-space: nowrap;
}
.not-found .query {
  color: #8f00d6;
  font-weight: 600;
  text-overflow: ellipsis;
  overflow: hidden;
}

@media (hover: hover) {
  .dropdown ul li:hover {
    background-color: var(--c-background-1);
    box-shadow: 0px 0px 2px 0px;
    cursor: pointer;
  }
}
</style>
