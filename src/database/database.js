let db = null;

const openDB = async (version, uid, newGroupId) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ocdb', version);

    request.addEventListener('upgradeneeded', (e) => {
      const database = e.target.result;

      createSchema(database, uid, newGroupId);
    });

    request.addEventListener('success', (e) => {
      db = e.target.result;
      db.addEventListener('close', closeListener);
      resolve(db);
    });

    request.addEventListener('error', (e) => {
      reject(e.target.error);
    });

    request.addEventListener('blocked', (e) => {
      reject(e.target.error);
    });
  });
};
const createSchema = (database, uid, groupId) => {
  if (!database.objectStoreNames.contains('preferences')) {
    database.createObjectStore('preferences');
  }
  if (!database.objectStoreNames.contains('profiles')) {
    database.createObjectStore('profiles');
  }

  if (uid) {
    const keyStoreName = `keys:${uid}`;
    if (!database.objectStoreNames.contains(keyStoreName)) {
      database.createObjectStore(keyStoreName);
    }
    const groupsStoreName = `groups:${uid}`;
    if (!database.objectStoreNames.contains(groupsStoreName)) {
      database.createObjectStore(groupsStoreName);
    }
  }
  if (uid && groupId) {
    const messagesStoreName = `messages:${groupId}`;
    const filesStoreName = `files:${groupId}`;
    if (!database.objectStoreNames.contains(messagesStoreName)) {
      const mOS = database.createObjectStore(messagesStoreName);
      mOS.createIndex('timestamp', 'timestamp', { unique: false });
    }
    if (!database.objectStoreNames.contains(filesStoreName)) {
      database.createObjectStore(filesStoreName);
    }
  }
};
const closeDB = () => {
  db?.removeEventListener('close', closeListener);
  db?.close();
};
const closeListener = () => {
  /* dispatch({ type: 'database/status', payload: null });
  dispatch({
    type: 'database/error',
    payload: errors.DB_CLOSED({ details: event.target?.error?.message ?? 'Not Available' })
  }); */
};
const schemaChange = async (uid, newGroupId) => {
  if (uid && !newGroupId) {
    const userSchemaExists =
      db.objectStoreNames.contains(`keys:${uid}`) && db.objectStoreNames.contains(`groups:${uid}`);
    if (userSchemaExists) return;
  }

  closeDB();
  await openDB(db.version + 1, uid, newGroupId);
};

const getSingleton = async (name) => {
  return new Promise((resolve, reject) => {
    if (!db) resolve(null);
    else {
      let request;
      try {
        request = db.transaction(name).objectStore(name).get('default');
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
      } catch (error) {
        reject(error);
      }
    }
  });
};
const updateSingleton = async (name, value) => {
  return new Promise((resolve, reject) => {
    try {
      const request = db.transaction(name, 'readwrite').objectStore(name).put(value, 'default');
      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    } catch (error) {
      reject(error);
    }
  });
};

const getObject = async (objectStore, key) => {
  return new Promise((resolve, reject) => {
    if (!db) resolve(null);
    else {
      let request;
      try {
        request = db.transaction(objectStore).objectStore(objectStore).get(key);
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
      } catch (error) {
        reject(error);
      }
    }
  });
};
const updateObject = async (objectStore, key, value) => {
  return new Promise((resolve, reject) => {
    try {
      const request = db.transaction(objectStore, 'readwrite').objectStore(objectStore).put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    } catch (error) {
      reject(error);
    }
  });
};
const deleteObject = async (objectStore, key) => {
  return new Promise((resolve, reject) => {
    try {
      const request = db.transaction(objectStore, 'readwrite').objectStore(objectStore).delete(key);
      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    } catch (error) {
      reject(error);
    }
  });
};
const getAll = async (objectStore) => {
  return new Promise((resolve, reject) => {
    if (!db) resolve(null);
    else {
      let request;
      try {
        request = db.transaction(objectStore).objectStore(objectStore).getAll();
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
      } catch (error) {
        reject(error);
      }
    }
  });
};
const getAllKeys = (objectStore) => {
  return new Promise((resolve, reject) => {
    if (!db) resolve(null);
    else {
      let request;
      try {
        request = db.transaction(objectStore).objectStore(objectStore).getAllKeys();
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
      } catch (error) {
        reject(error);
      }
    }
  });
};

const iterateCursor = (objectStoreName, indexName, batchSize = 20, position) => {
  return new Promise((resolve, reject) => {
    let results = [];
    let cursorRequest;
    let store = db.transaction(objectStoreName).objectStore(objectStoreName);
    let advanceBy = position;

    cursorRequest = store.index(indexName).openCursor(null, 'prev');

    cursorRequest.onsuccess = function (event) {
      let cursor = event.target.result;
      if (advanceBy) {
        advanceBy = null;
        cursor?.advance(position);
        return;
      }

      if (cursor && results.length < batchSize) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        resolve({ results, cursorPosition: cursor ? cursor.key : null });
      }
    };

    cursorRequest.onerror = (event) => reject(event.target.error);
  });
};
async function* cursorGenerator(objectStoreName, indexName, batchSize = 20) {
  let results;
  const maxCount = await getCount(objectStoreName);
  let count = 0;

  do {
    ({ results } = await iterateCursor(objectStoreName, indexName, batchSize, count));
    count += results.length;
    yield results;
  } while (count < maxCount);
}
async function* stream(objectStoreName, indexName) {
  let cursorIterator = cursorGenerator(objectStoreName, indexName);

  for await (const value of cursorIterator) {
    yield value;
  }
}
const getCount = async (objectStore) => {
  return new Promise((resolve, reject) => {
    if (!db) resolve(null);
    else {
      let request;
      try {
        request = db.transaction(objectStore).objectStore(objectStore).count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
      } catch (error) {
        reject(error);
      }
    }
  });
};
const getIndexCount = async (objectStore, indexName, keyRange) => {
  return new Promise((resolve, reject) => {
    if (!db) resolve(null);
    else {
      let request;
      try {
        request = db.transaction(objectStore).objectStore(objectStore).index(indexName).count(keyRange);
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
      } catch (error) {
        reject(error);
      }
    }
  });
};

export {
  db,
  openDB,
  closeDB,
  schemaChange,
  getSingleton,
  updateSingleton,
  getObject,
  updateObject,
  deleteObject,
  getAll,
  getAllKeys,
  getCount,
  stream,
  getIndexCount
};
