/* idb-keyval v6 — vendored for offline PWA (MIT, Jake Archibald) */

function promisifyRequest(request) {
  return new Promise((resolve, reject) => {
    request.oncomplete = request.onsuccess = () => resolve(request.result);
    request.onabort = request.onerror = () => reject(request.error);
  });
}

function createStore(dbName, storeName) {
  let dbp;
  const getDB = () => {
    if (dbp) return dbp;
    const request = indexedDB.open(dbName);
    request.onupgradeneeded = () => request.result.createObjectStore(storeName);
    dbp = promisifyRequest(request);
    dbp.then((db) => {
      db.onclose = () => {
        dbp = undefined;
      };
    }, () => {});
    return dbp;
  };
  return (txMode, callback) =>
    getDB().then((db) => callback(db.transaction(storeName, txMode).objectStore(storeName)));
}

let defaultGetStoreFunc;

function defaultGetStore() {
  if (!defaultGetStoreFunc) {
    defaultGetStoreFunc = createStore('keyval-store', 'keyval');
  }
  return defaultGetStoreFunc;
}

export function get(key, customStore = defaultGetStore()) {
  return customStore('readonly', (store) => promisifyRequest(store.get(key)));
}

export function set(key, value, customStore = defaultGetStore()) {
  return customStore('readwrite', (store) => {
    store.put(value, key);
    return promisifyRequest(store.transaction);
  });
}

export function del(key, customStore = defaultGetStore()) {
  return customStore('readwrite', (store) => {
    store.delete(key);
    return promisifyRequest(store.transaction);
  });
}