/**
 * CHIEF IndexedDB Adapter
 * 
 * Provides robust, typed, transactional storage backed by window.indexedDB.
 * Handles storage quotas, private mode limitations, and schema version upgrades.
 */

import { 
  STORAGE_SCHEMA_VERSION, 
  StorageEnvironment, 
  STORE_NAMES, 
  getDatabaseName 
} from './schema';

let dbInstances: Record<StorageEnvironment, IDBDatabase | null> = {
  PROD: null,
  DEV: null
};

/**
 * Checks whether IndexedDB is available and functional in the current browser runtime.
 */
export function isIndexedDBAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB !== null;
  } catch {
    return false;
  }
}

/**
 * Opens and initializes the Chief IndexedDB database for the target environment.
 */
export async function openDatabase(environment: StorageEnvironment): Promise<IDBDatabase> {
  if (dbInstances[environment]) {
    return dbInstances[environment]!;
  }

  if (!isIndexedDBAvailable()) {
    throw new Error('IndexedDB is not available in this browser environment.');
  }

  const dbName = getDatabaseName(environment);

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(dbName, STORAGE_SCHEMA_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Offline Queue Store: primary key 'id', index on 'userNamespace'
      if (!db.objectStoreNames.contains(STORE_NAMES.QUEUE)) {
        const queueStore = db.createObjectStore(STORE_NAMES.QUEUE, { keyPath: 'id' });
        queueStore.createIndex('userNamespace', 'userNamespace', { unique: false });
        queueStore.createIndex('environment', 'environment', { unique: false });
      }

      // 2. Worker Reports Store: primary key 'id', index on 'userNamespace'
      if (!db.objectStoreNames.contains(STORE_NAMES.REPORTS)) {
        const reportStore = db.createObjectStore(STORE_NAMES.REPORTS, { keyPath: 'id' });
        reportStore.createIndex('userNamespace', 'userNamespace', { unique: false });
        reportStore.createIndex('environment', 'environment', { unique: false });
      }

      // 3. Telemetry Cache Store: primary key 'resourceKey', index on 'userNamespace'
      if (!db.objectStoreNames.contains(STORE_NAMES.TELEMETRY_CACHE)) {
        const cacheStore = db.createObjectStore(STORE_NAMES.TELEMETRY_CACHE, { keyPath: 'resourceKey' });
        cacheStore.createIndex('userNamespace', 'userNamespace', { unique: false });
      }

      // 4. Metadata Store: primary key 'key'
      if (!db.objectStoreNames.contains(STORE_NAMES.METADATA)) {
        db.createObjectStore(STORE_NAMES.METADATA, { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      dbInstances[environment] = db;

      db.onversionchange = () => {
        db.close();
        dbInstances[environment] = null;
      };

      resolve(db);
    };

    request.onerror = () => {
      reject(request.error || new Error(`Failed to open IndexedDB [${dbName}].`));
    };

    request.onblocked = () => {
      reject(new Error(`IndexedDB open request for [${dbName}] was blocked.`));
    };
  });
}

/**
 * Generic put operation into an object store.
 */
export async function idbPut<T>(
  environment: StorageEnvironment,
  storeName: typeof STORE_NAMES[keyof typeof STORE_NAMES],
  value: T
): Promise<void> {
  const db = await openDatabase(environment);
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(value);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error || new Error(`Write failed on ${storeName}`));
      tx.onerror = () => reject(tx.error || new Error(`Transaction error on ${storeName}`));
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Generic get by key from an object store.
 */
export async function idbGet<T>(
  environment: StorageEnvironment,
  storeName: typeof STORE_NAMES[keyof typeof STORE_NAMES],
  key: IDBValidKey
): Promise<T | null> {
  const db = await openDatabase(environment);
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);

      req.onsuccess = () => resolve((req.result as T) || null);
      req.onerror = () => reject(req.error || new Error(`Read failed on ${storeName}`));
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Query all records matching userNamespace index.
 */
export async function idbGetByUser<T>(
  environment: StorageEnvironment,
  storeName: typeof STORE_NAMES.QUEUE | typeof STORE_NAMES.REPORTS | typeof STORE_NAMES.TELEMETRY_CACHE,
  userNamespace: string
): Promise<T[]> {
  const db = await openDatabase(environment);
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const index = store.index('userNamespace');
      const req = index.getAll(IDBKeyRange.only(userNamespace));

      req.onsuccess = () => resolve((req.result as T[]) || []);
      req.onerror = () => reject(req.error || new Error(`Query failed on ${storeName} for user ${userNamespace}`));
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Delete a single record by primary key.
 */
export async function idbDelete(
  environment: StorageEnvironment,
  storeName: typeof STORE_NAMES[keyof typeof STORE_NAMES],
  key: IDBValidKey
): Promise<void> {
  const db = await openDatabase(environment);
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error || new Error(`Delete failed on ${storeName}`));
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Clear all records scoped to a user namespace.
 */
export async function idbClearUserRecords(
  environment: StorageEnvironment,
  storeName: typeof STORE_NAMES.QUEUE | typeof STORE_NAMES.REPORTS | typeof STORE_NAMES.TELEMETRY_CACHE,
  userNamespace: string
): Promise<void> {
  const db = await openDatabase(environment);
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const index = store.index('userNamespace');
      const request = index.openCursor(IDBKeyRange.only(userNamespace));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error || new Error(`Cursor error on ${storeName}`));
      tx.onerror = () => reject(tx.error || new Error(`Transaction error during user clear on ${storeName}`));
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Atomically synchronize records for a specific user namespace.
 * Deletes records belonging to userNamespace that are no longer present,
 * and saves/updates all current records.
 */
export async function idbSyncUserRecords<T extends { id: string }>(
  environment: StorageEnvironment,
  storeName: typeof STORE_NAMES.QUEUE | typeof STORE_NAMES.REPORTS,
  userNamespace: string,
  records: T[]
): Promise<void> {
  const db = await openDatabase(environment);
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const index = store.index('userNamespace');
      const targetIds = new Set(records.map(r => r.id));

      const request = index.openCursor(IDBKeyRange.only(userNamespace));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const item = cursor.value as { id: string };
          if (!targetIds.has(item.id)) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          for (const record of records) {
            store.put(record);
          }
        }
      };

      request.onerror = () => reject(request.error || new Error(`Cursor error syncing ${storeName}`));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error(`Transaction error during user sync on ${storeName}`));
    } catch (err) {
      reject(err);
    }
  });
}
