<script setup>
import { onMounted, ref, watch } from 'vue';

import Button from '../Button/Button.vue';
import Option from '../Option/Option.vue';

const props = defineProps({
  options: Array,
  icon: {
    type: String,
    default: 'menu'
  }
});
const emit = defineEmits(['select']);

const open = ref(false);
const direction = ref('br');
const pos = ref({ x: 0, y: 0 });
const active = ref(-1);
const el = ref(null);
const container = ref(null);

const handleClick = (e) => {
  e?.preventDefault();
  e?.stopPropagation();
  open.value = !open.value;
  if (open.value) {
    active.value = -1;
    el.value.focus();
  } else {
    forceBlur();
  }
};
const forceBlur = () => {
  if (document.activeElement === el.value) {
    document.activeElement.blur();
  }
};
const handleBlur = () => {
  open.value = false;
};
const handleKey = (e) => {
  if (!open.value) return;
  if ('Tab' === e.code) e.preventDefault();
  if ('Escape' === e.code) {
    forceBlur();
    return;
  }
  if (['ArrowUp', 'ArrowDown'].includes(e.code)) {
    let idx = active.value;
    if (e.code === 'ArrowUp') {
      idx -= 1;
    } else if (e.code === 'ArrowDown') {
      idx += 1;
    }
    idx = (idx < 0 ? props.options.length - Math.abs(idx) : idx) % props.options.length;
    active.value = idx;
  } else if (e.code === 'Enter') {
    emit('select', props.options[active.value]);
  }
};
const handleSelect = (option) => {
  emit('select', option);
  forceBlur();
};
const computeOpeningDirection = () => {
  const rect = el.value.getBoundingClientRect();
  const cRect = container.value.getBoundingClientRect();
  let xAxis = true;
  let yAxis = true;
  if (cRect.x + rect.width > window.innerWidth) xAxis = false;
  if (cRect.y + cRect.height + rect.height > window.innerHeight) yAxis = false;
  direction.value = `${yAxis ? 'b' : 't'}${xAxis ? 'r' : 'l'}`;
  if (direction.value === 'br') pos.value = { x: cRect.x, y: cRect.y + cRect.height };
  else if (direction.value === 'tr') pos.value = { x: cRect.x, y: cRect.y };
  else if (direction.value === 'bl')
    pos.value = { x: cRect.x + cRect.width - rect.width, y: cRect.y + cRect.height };
  else if (direction.value === 'tl') pos.value = { x: cRect.x + cRect.width - rect.width, y: cRect.y };
};
const openMenu = () => {
  if (!open.value) {
    handleClick();
  }
};

watch(open, () => {
  if (open.value) {
    computeOpeningDirection();
  }
});

onMounted(() => computeOpeningDirection());

defineExpose({ openMenu });
</script>

<template>
  <div
    ref="container"
    @keydown.enter="handleClick"
    @pointerdown="handleClick"
    @click="(e) => e.stopPropagation()"
    tabindex="0"
    class="options"
  >
    <Button
      :size="1.5"
      :class="{ active: open }"
      tabindex="-1"
      class="control"
      :icon="icon"
      :complementary="false"
      circular
      flat
    />
    <div
      :tabindex="open ? 0 : -1"
      class="menu"
      :class="{ open, [direction]: true }"
      ref="el"
      :style="{ left: `${pos.x}px`, top: `${pos.y}px` }"
      @blur="handleBlur"
      @keydown="handleKey"
    >
      <ul>
        <li v-for="(option, idx) in options" :key="option.text">
          <Option @select="handleSelect" :data="option" :active="active === idx" />
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.control:deep(img) {
  filter: invert(51%) sepia(3%) saturate(99%) hue-rotate(20deg) brightness(90%) contrast(88%);
}
.control.active {
  background-color: var(--c-background-2);
}
.menu {
  position: fixed;
  z-index: 50;
  background-color: var(--c-background-1);
  overflow: hidden;
  transition:
    max-height var(--fx-transition-duration-2) ease,
    clip-path var(--fx-transition-duration-1) ease;
  pointer-events: none;
  width: 14rem !important;
}
.menu:focus {
  outline: none;
}
.menu.br {
  box-shadow: 2px 2px 4px 0px var(--c-shadow-0);
  clip-path: polygon(0% 0%, 0% 0%, 0% 0%, 0% 0%);
}
.menu.bl {
  box-shadow: 2px 2px 4px 0px var(--c-shadow-0);
  clip-path: polygon(100% 0%, 100% 0%, 100% 0%, 100% 0%);
}
.menu.tl {
  box-shadow: 2px 2px 4px 0px var(--c-shadow-0);
  clip-path: polygon(100% 100%, 100% 100%, 100% 100%, 100% 100%);
  transform: translateY(-100%);
}
.menu.tr {
  box-shadow: 2px -2px 4px 0px var(--c-shadow-0);
  clip-path: polygon(0% 100%, 0% 100%, 0% 100%, 0% 100%);
  transform: translateY(-100%);
}
.menu.open {
  pointer-events: all;
}
/* bl, tl not handled */
.menu.br.open {
  clip-path: polygon(0% 0%, 105% 0%, 105% 105%, 0% 105%);
}
.menu.bl.open {
  clip-path: polygon(0% 0%, 105% 0%, 105% 105%, 0% 105%);
}
.menu.tl.open {
  clip-path: polygon(0% 0%, 105% 0%, 105% 105%, 0% 105%);
}
.menu.tr.open {
  clip-path: polygon(0% -5%, 105% -5%, 105% 100%, 0% 100%);
}

.menu ul {
  list-style: none;
  user-select: none;
  padding: 0;
}
.menu ul li {
  width: 100%;
}

@media (hover: hover) {
  .menu ul li:hover {
    background-color: var(--c-background-1);
    cursor: pointer;
  }
}
</style>
