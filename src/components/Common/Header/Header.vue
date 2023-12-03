<script setup></script>

<template>
  <header :class="{ header: true }">
    <div class="left">
      <slot name="left"></slot>
    </div>
    <div class="right">
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
  position: fixed;
  z-index: 10;
  background-color: var(--c-background-0);
  border-bottom: 1px solid var(--c-box-border);
}
.header.drop {
  box-shadow: 0 0 5px 0 var(--c-shadow-0);
}

header.header .left,
header.header .right {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 0 0.5rem;
}
header.header .left {
  justify-content: start;
}
header.header .right {
  justify-content: end;
}
</style>
