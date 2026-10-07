import { couchDefaults, repairCouch, type CouchSave } from './party';

/** Separate key and backup scope: adult rounds never write neo.save or its IndexedDB store. */
export const COUCH_KEY = 'neo.couch.v1';
export class CouchStore {
  data: CouchSave = couchDefaults();
  warning = '';
  constructor() {
    try { this.data = repairCouch(JSON.parse(localStorage.getItem(COUCH_KEY) ?? 'null')); }
    catch { this.warning = 'Couch progress could not be loaded. This session still works.'; }
  }
  save() {
    try { localStorage.setItem(COUCH_KEY, JSON.stringify(this.data)); this.warning = ''; }
    catch { this.warning = 'Couch progress could not be saved. Keep this tab open or download a couch backup.'; }
  }
}

/** Keep the in-memory trip playable even if the browser refuses a storage write. */
export const couchStore = new CouchStore();
