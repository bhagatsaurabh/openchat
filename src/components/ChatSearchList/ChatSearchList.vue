<script setup>
import { watch, ref, computed } from 'vue';

import { useRemoteDBStore } from '@/stores/database';
import ChatSearchListItem from '@/components/ChatSearchListItem/ChatSearchListItem.vue';
import Button from '../Common/Button/Button.vue';

const props = defineProps({
  query: {
    type: String,
    default: ''
  }
});

const db = useRemoteDBStore();
const list = ref([]);
const page = ref(0);
const numPages = ref(0);
const isBusy = ref(false);
const fbType = computed(() => {
  if (props.query.length < 3) return 'q-lt-3';
  else if (!isBusy.value && page.value === numPages.value && list.value.length !== 0) return 'eos';
  else if (!isBusy.value && list.value.length === 0) return 'not-found';
  return null;
});

const searchUsers = async () => {
  isBusy.value = true;
  if (!page.value) {
    const { users, nbPages } = await db.searchUsers(props.query, page.value);
    list.value = users;
    numPages.value = nbPages;
    if (numPages.value > 0) page.value += 1;
  } else {
    const { users } = await db.searchUsers(props.query, page.value);
    list.value = [...list.value, ...users];
  }
  isBusy.value = false;
};

const handleSelect = (user) => {
  console.log(user);
};

watch(
  () => props.query,
  async () => {
    if (props.query) {
      if (props.query.length >= 3) {
        page.value = 0;
        numPages.value = 0;
        await searchUsers();
      } else {
        list.value = [];
      }
    }
  }
);
</script>

<template>
  <section class="chat-search-list scroll-shadows-0 scroll-shadows">
    <ChatSearchListItem v-for="user in list" :key="user.id" :meta="user" @select="handleSelect" />
    <div class="list-fb">
      <h3 v-if="fbType === 'q-lt-3'"><i>Please type at least 3 characters to search</i></h3>
      <h3 v-if="fbType === 'eos'"><i>End of search</i></h3>
      <h3 v-if="fbType === 'not-found'"><i>No users found</i></h3>
      <Button
        v-show="query.length >= 3 && (isBusy || page !== numPages)"
        class="control"
        :complementary="false"
        :busy="isBusy"
        flat
        async
      >
        Find more
      </Button>
    </div>
  </section>
</template>

<style scoped>
.chat-search-list {
  height: 100%;
}
.list-fb h3 {
  text-align: center;
  padding: 1rem;
  font-weight: 100;
  color: var(--c-text-2);
}
.control {
  margin: auto;
  color: #a450ce;
  border: 1px solid var(--c-border-0);
  margin-top: 1rem;
}
</style>
