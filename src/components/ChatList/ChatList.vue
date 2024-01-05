<script setup>
import ChatListItem from '../ChatListItem/ChatListItem.vue';
import Icon from '../Common/Icon/Icon.vue';
import Link from '../Common/Link/Link.vue';

defineProps({
  groups: {
    type: Array,
    default: () => []
  },
  query: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['select', 'open-search', 'self-chat']);
</script>

<template>
  <section class="chat-list scroll-shadows-0 scroll-shadows">
    <ChatListItem v-for="group in groups" :key="group.id" :group="group" @select="(e) => emit('select', e)" />
    <div class="empty" v-if="groups.length === 0">
      <h3 class="flex-center mb-1">
        <Icon class="mr-0p5" :size="2" name="chats-accented" alt="no-chats icon" singular /> No chats
      </h3>
      <h3>
        Use <Link @click="emit('open-search')">Search</Link> to find other users or
        <Link @click="emit('self-chat')">Chat with yourself</Link>
      </h3>
    </div>
  </section>
</template>

<style scoped>
.chat-list {
  height: 100%;
}
.empty {
  padding: 0 1rem 0 1rem;
  margin-top: 3rem;
  display: flex;
  flex-direction: column;
}
.empty span {
  font-size: 0;
}
.empty h3 {
  font-weight: lighter;
  text-align: center;
}
</style>
