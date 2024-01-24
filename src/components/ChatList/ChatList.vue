<script setup>
import { computed } from 'vue';
import ChatListItem from '../ChatListItem/ChatListItem.vue';
import Icon from '../Common/Icon/Icon.vue';
import Link from '../Common/Link/Link.vue';

const props = defineProps({
  groups: {
    type: Array,
    default: () => []
  },
  query: {
    type: String,
    default: ''
  },
  unread: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['select', 'open-search', 'self-chat', 'clear-filter']);

const filteredGroups = computed(() =>
  props.groups.filter(
    (group) =>
      (props.unread ? group.unseenCount > 0 : true) &&
      group.name.toLowerCase().includes(props.query.toLowerCase())
  )
);
</script>

<template>
  <section class="chat-list scroll-shadows-0 scroll-shadows">
    <ChatListItem
      v-for="group in filteredGroups"
      :key="group.id"
      :group="group"
      @select="(id) => emit('select', id)"
    />
    <div class="fb filtered" v-if="groups.length && !filteredGroups.length">
      <h3 class="flex-center mb-1">
        <Icon class="mr-0p5" :size="2" name="chats-accented" alt="no-chats icon" singular />
        {{ query ? `No chats found for '${query}'` : 'No chats with unread messages' }}
      </h3>
      <h3><Link @click="emit('clear-filter')">Clear</Link></h3>
    </div>
    <div class="fb" v-if="!groups.length">
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
.fb {
  padding: 0 1rem 0 1rem;
  margin-top: 3rem;
  display: flex;
  flex-direction: column;
}
.fb span {
  font-size: 0;
}
.fb h3 {
  font-weight: lighter;
  text-align: center;
}
</style>
