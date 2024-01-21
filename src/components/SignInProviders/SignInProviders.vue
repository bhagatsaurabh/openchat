<script setup>
import Button from '@/components/Common/Button/Button.vue';

const emit = defineEmits(['provider']);
</script>

<template>
  <section class="signin-providers">
    <Button @click="emit('provider', 'phone')" icon="phone" icon-left :complementary="false" :size="1">
      Sign In with Phone
    </Button>
    <Button @click="emit('provider', 'anonymous')" icon="guest" icon-left :complementary="false" :size="1">
      Continue as Guest
    </Button>
  </section>
</template>

<style scoped>
.signin-providers {
  text-align: center;
}
.signin-providers button {
  margin: auto;
}
.signin-providers button:not(:last-child) {
  margin-bottom: 1rem;
}
</style>
