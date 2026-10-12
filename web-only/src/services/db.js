/**
 * Lightweight client-side IndexedDB storage for custom certificate templates.
 * Provides fallback to memory/localStorage if IndexedDB is unavailable.
 */

const DB_NAME = 'BulkCertificatesDB';
const DB_VERSION = 1;
const STORE_TEMPLATES = 'custom_templates';

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_TEMPLATES)) {
        db.createObjectStore(STORE_TEMPLATES, { keyPath: 'id' });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = () => resolve(null); // fallback if blocked
  });
}

export async function getAllCustomTemplates() {
  const db = await openDatabase();
  if (!db) {
    try {
      const raw = localStorage.getItem('custom_templates_v1');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  return new Promise((resolve) => {
    const tx = db.transaction(STORE_TEMPLATES, 'readonly');
    const store = tx.objectStore(STORE_TEMPLATES);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => resolve([]);
  });
}

export async function saveCustomTemplate(template) {
  const db = await openDatabase();
  if (!db) {
    try {
      const list = await getAllCustomTemplates();
      const updated = [template, ...list.filter((t) => t.id !== template.id)];
      localStorage.setItem('custom_templates_v1', JSON.stringify(updated));
    } catch (err) {
      console.warn('LocalStorage save failed:', err);
    }
    return template;
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_TEMPLATES, 'readwrite');
    const store = tx.objectStore(STORE_TEMPLATES);
    const req = store.put(template);
    req.onsuccess = () => resolve(template);
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function deleteCustomTemplate(templateId) {
  const db = await openDatabase();
  if (!db) {
    try {
      const list = await getAllCustomTemplates();
      const updated = list.filter((t) => t.id !== templateId);
      localStorage.setItem('custom_templates_v1', JSON.stringify(updated));
    } catch {
      // ignore
    }
    return;
  }

  return new Promise((resolve) => {
    const tx = db.transaction(STORE_TEMPLATES, 'readwrite');
    const store = tx.objectStore(STORE_TEMPLATES);
    const req = store.delete(templateId);
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
  });
}
