let db = null;

const openDB = async (version, uid, newGroups = []) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ocdb', version);

    request.addEventListener('upgradeneeded', (e) => {
      const database = e.target.result;

      if (!database.objectStoreNames.contains('preferences')) {
        database.createObjectStore('preferences');
      }
      if (!database.objectStoreNames.contains('keys')) {
        database.createObjectStore('keys');
      }

      if (uid) {
        newGroups.forEach((groupId) => {
          const newGroupName = `group:${uid}:${groupId}`;
          if (!database.objectStoreNames.contains(newGroupName)) {
            database.createObjectStore(newGroupName);
            database.createObjectStore(`messages:${groupId}`);
          }
        });
      }

      db = database;
      db.addEventListener('close', closeListener);
      resolve(db);
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
const closeDB = () => {
  db?.removeEventListener('close', closeListener);
  db?.close();
};
const closeListener = (event) => {
  /* dispatch({ type: 'database/status', payload: null });
  dispatch({
    type: 'database/error',
    payload: errors.DB_CLOSED({ details: event.target?.error?.message ?? 'Not Available' })
  }); */
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
const updateObject = async (objectStore, value, key) => {
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

export { db, openDB, closeDB, getSingleton, updateSingleton, getObject, updateObject };
