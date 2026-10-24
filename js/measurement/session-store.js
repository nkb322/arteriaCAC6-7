const DB_NAME = 'arteria-measurements-v1';
export class SessionStore {
  constructor(factory = globalThis.indexedDB) { this.factory = factory; this.opening = null; }
  open() {
    if (!this.factory) return Promise.reject(new Error('storage'));
    if (!this.opening) this.opening = new Promise((resolve, reject) => {
      const request = this.factory.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore('sessions', {keyPath: 'id'});
      request.onsuccess = () => { const db = request.result; db.onversionchange = () => { db.close(); this.opening = null; }; resolve(db); };
      request.onerror = () => reject(new Error('storage'));
      request.onblocked = () => reject(new Error('storageBlocked'));
    }).catch(error => { this.opening = null; throw error; });
    return this.opening;
  }
  async transaction(mode, operation) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sessions', mode);
      let request;
      try { request = operation(tx.objectStore('sessions')); } catch (e) { reject(e); return; }
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = tx.onabort = () => reject(new Error('storage'));
    });
  }
  save(session) { return this.transaction('readwrite', store => store.put(session)); }
  async list() { return (await this.transaction('readonly', store => store.getAll())).sort((a, b) => b.startedAt.localeCompare(a.startedAt)); }
  get(id) { return this.transaction('readonly', store => store.get(id)); }
  delete(id) { return this.transaction('readwrite', store => store.delete(id)); }
}
