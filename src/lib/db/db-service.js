import { DB_CONFIG } from '@/lib/db/db-config';

class DBService {
  constructor() {
    this.db = null;
    this.initDB();
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const checkRequest = indexedDB.open(DB_CONFIG.name);
      
      checkRequest.onsuccess = (event) => {
        const existingDb = event.target.result;
        const currentVersion = existingDb.version;
        existingDb.close();

        if (currentVersion !== DB_CONFIG.version) {
          const deleteRequest = indexedDB.deleteDatabase(DB_CONFIG.name);
          deleteRequest.onsuccess = () => {
            console.log('Database deleted successfully, recreating...');
            this.createDatabase().then(resolve).catch(reject);
          };
          deleteRequest.onerror = () => reject('Could not delete database');
        } else {
          this.createDatabase().then(resolve).catch(reject);
        }
      };

      checkRequest.onerror = () => {
        this.createDatabase().then(resolve).catch(reject);
      };
    });
  }

  async createDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);

      request.onerror = (event) => {
        console.error('Database error:', event.target.error);
        reject('Error opening database');
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        console.log('Database opened successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        Object.values(DB_CONFIG.stores).forEach(store => {
          if (!db.objectStoreNames.contains(store.name)) {
            const objectStore = db.createObjectStore(store.name, {
              keyPath: store.keyPath,
              autoIncrement: store.autoIncrement
            });
            store.indexes.forEach(index => {
              objectStore.createIndex(index.name, index.keyPath, index.options);
            });
          }
        });
      };
    });
  }

  async ensureDBConnection() {
    if (!this.db) {
      await this.initDB();
    }
    return this.db;
  }

  // Generic Database Operations
  async getAll(storeName) {
    const db = await this.ensureDBConnection();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(`Error getting all from ${storeName}`);
      } catch (error) {
        reject(`Error accessing store ${storeName}: ${error.message}`);
      }
    });
  }

  async getAllFromIndex(storeName, indexName, value) {
    const db = await this.ensureDBConnection();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(value);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(`Error getting from index ${indexName}`);
      } catch (error) {
        reject(`Error accessing index ${indexName}: ${error.message}`);
      }
    });
  }

  async get(storeName, id) {
    const db = await this.ensureDBConnection();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(`Error getting from ${storeName}`);
      } catch (error) {
        reject(`Error accessing store ${storeName}: ${error.message}`);
      }
    });
  }

  async add(storeName, item) {
    const db = await this.ensureDBConnection();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(item);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(`Error adding to ${storeName}`);
      } catch (error) {
        reject(`Error accessing store ${storeName}: ${error.message}`);
      }
    });
  }

  async put(storeName, item) {
    const db = await this.ensureDBConnection();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(item);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(`Error updating in ${storeName}`);
      } catch (error) {
        reject(`Error accessing store ${storeName}: ${error.message}`);
      }
    });
  }

  async delete(storeName, id) {
    const db = await this.ensureDBConnection();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(`Error deleting from ${storeName}`);
      } catch (error) {
        reject(`Error accessing store ${storeName}: ${error.message}`);
      }
    });
  }
}

export const dbService = new DBService();