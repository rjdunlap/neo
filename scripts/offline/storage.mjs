/** Inspect only an isolated browser context's public save, without production dev helpers. */
export function publicSave(page) {
const read = () => page.evaluate(() => new Promise((resolve, reject) => {
  const open = indexedDB.open('keyval-store', 1);
  open.onerror = () => reject(open.error);
  open.onsuccess = () => {
    const db = open.result, request = db.transaction('keyval').objectStore('keyval').get('neo.save');
    request.onsuccess = () => { resolve(request.result); db.close(); };
    request.onerror = () => { reject(request.error); db.close(); };
  };
}));
const write = (value) => page.evaluate((value) => new Promise((resolve, reject) => {
  const open = indexedDB.open('keyval-store', 1);
  open.onerror = () => reject(open.error);
  open.onsuccess = () => {
    const db = open.result, tx = db.transaction('keyval', 'readwrite');
    tx.objectStore('keyval').put(value, 'neo.save');
    tx.oncomplete = () => { resolve(); db.close(); };
    tx.onerror = () => { reject(tx.error); db.close(); };
  };
}), value);

return { read, write };
}

/** Reward/transition speech and IndexedDB writes finish asynchronously; observe the save instead of guessing a delay. */
export async function waitForSave(read, accept, message, timeout = 15000) {
  const deadline = Date.now() + timeout;
  do {
    const save = await read();
    if (accept(save)) return save;
    await new Promise(resolve => setTimeout(resolve, 100));
  } while (Date.now() < deadline);
  throw new Error(message);
}
