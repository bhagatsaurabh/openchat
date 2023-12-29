<script setup>
import { watch, ref } from 'vue';

import { useRemoteDBStore } from '@/stores/database';

const props = defineProps({
  query: {
    type: String,
    default: ''
  }
});

const db = useRemoteDBStore();
const list = ref([]);
const lastDoc = ref(null);

watch(
  () => props.query,
  async () => {
    if (props.query) {
      const result = await db.searchUsers(props.query);
      console.log(result);
      list.value = result;

      if (list.value.length) {
        lastDoc.value = list.value[list.value.length - 1];
      } else {
        lastDoc.value = null;
      }
    }
  }
);
</script>

<template>
  <div class="chat-search-list">ChatSearchList component</div>
</template>

<style scoped>
.chat-search-list {
  height: 100%;
}
</style>
