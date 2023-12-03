<script setup></script>

<template>
  <footer :class="{ footer: true }">
    <div class="left">
      <slot name="left"></slot>
    </div>
    <div class="right">
      <slot name="right"></slot>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  display: flex;
  width: 100%;
  height: var(--footer-height);
  bottom: 0;
  position: fixed;
  z-index: 10;
  background-color: var(--c-background-0);
  border-top: 1px solid var(--c-box-border);
}
.footer.drop {
  box-shadow: 0 0 5px 0 var(--c-shadow-0);
}

footer.footer .left,
footer.footer .right {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 0 0.5rem;
}
footer.footer .left {
  justify-content: start;
}
footer.footer .right {
  justify-content: end;
}
</style>
