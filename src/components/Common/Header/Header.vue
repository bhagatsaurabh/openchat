<script setup>
defineProps({
  fixed: {
    type: Boolean,
    default: false
  },
  border: {
    type: Boolean,
    default: false
  }
});
</script>

<template>
  <header :class="{ header: true, fixed, border }">
    <div class="left">
      <slot name="left"></slot>
    </div>
    <div v-if="$slots.right" class="right">
      <slot name="right"></slot>
    </div>
  </header>
</template>

<style scoped>
.header {
  display: flex;
  width: 100%;
  height: var(--header-height);
  top: 0;
  z-index: 10;
  background-color: var(--c-background-0);
  border-bottom: 1px solid var(--c-box-border);
}
.header.fixed {
  position: fixed;
}
.header.drop {
  box-shadow: 0 0 5px 0 var(--c-shadow-0);
}
.header.border {
  border-bottom: 1px solid var(--c-border-0);
}

header.header .left,
header.header .right {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 0 0.5rem;
  overflow: hidden;
}
header.header .left {
  justify-content: start;
}
header.header .right {
  justify-content: end;
}
</style>
