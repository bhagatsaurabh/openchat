import { remoteDB } from '@/config/firebase';
import { collection, getDocs } from 'firebase/firestore';

// For testing with emulators only
const fetchUsersFirestore = async (query) => {
  const snapshot = await getDocs(collection(remoteDB, 'users'));
  const users = [];
  snapshot.forEach((snap) => users.push(snap.data()));
  return { hits: users.filter((user) => user.name.toLowerCase().includes(query.toLowerCase())), nbPages: 1 };
};

const fetchUsersAlgolia = async (query, page) => {
  const res = await fetch('https://UYFAS89LW0-dsn.algolia.net/1/indexes/users/query', {
    method: 'POST',
    body: JSON.stringify({
      query,
      facets: ['*'],
      page
    }),
    headers: {
      'Content-Type': 'application/json',
      'x-algolia-application-id': 'UYFAS89LW0',
      'x-algolia-api-key': 'db16b1118a75abf483da00b135870432'
    }
  });
  return await res.json();
};

export const fetchUsers = async (query, page = 0) => {
  if (location.hostname === 'localhost') {
    return await fetchUsersFirestore(query);
  }
  return await fetchUsersAlgolia(query, page);
};
