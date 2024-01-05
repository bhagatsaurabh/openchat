<script setup>
const props = defineProps({
  href: {
    type: String,
    default: ''
  }
});
const emit = defineEmits(['click']);

const handleClick = (e) => {
  if (props.href) return;
  e.preventDefault();
  emit('click');
};
</script>

<template>
  <a :href="href" class="link" @click="handleClick"><slot></slot></a>
</template>

<style scoped>
.link {
  text-decoration: none;
  color: var(--c-accent);
  font-weight: normal;
}
</style>
