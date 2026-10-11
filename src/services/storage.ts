export interface Spot {
  id: string;
  name: string;
  createdAt: number;
}

export interface Session {
  id: string;
  spotId: string | null;
  sceneId: string;
  startedAt: number;
  plannedMinutes: number;
  actualSeconds: number;
  completed: boolean;
  endedEarly: boolean;
}

export interface JournalEntry {
  id: string;
  sessionId: string | null;
  createdAt: number;
  observations: string[]; // up to 3
  mood: 'calm' | 'restless' | 'sleepy' | 'happy' | 'heavy' | '';
  text: string;
  photoId: string | null;
}

export interface PhotoAsset {
  id: string;
  dataUrl: string;
  createdAt: number;
}

export type AmbientSound = 'silence' | 'wind' | 'rain' | 'crickets' | 'stream';
export type BellTone = 'singing-bowl' | 'temple-bell' | 'wood-clapper';

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  breathing: boolean;
  motion: boolean;
  defaultMinutes: number;
  defaultSceneId: string;
  ambient: AmbientSound;
  bellTone?: BellTone;
  senseGuide?: boolean;
  reminderEnabled: boolean;
  reminderTime: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  breathing: true,
  motion: true,
  defaultMinutes: 10,
  defaultSceneId: 'meadow',
  ambient: 'silence',
  bellTone: 'singing-bowl',
  senseGuide: true,
  reminderEnabled: false,
  reminderTime: '08:00',
};

const DB_NAME = 'placid_db';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('spots')) {
        db.createObjectStore('spots', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('sessions')) {
        db.createObjectStore('sessions', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('entries')) {
        db.createObjectStore('entries', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('photos')) {
        db.createObjectStore('photos', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// SPOTS
export async function getSpots(): Promise<Spot[]> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('spots', 'readonly');
    const store = tx.objectStore('spots');
    const req = store.getAll();
    req.onsuccess = () => {
      const list = (req.result as Spot[]) || [];
      if (list.length === 0) {
        // Seed initial spots
        const initial: Spot[] = [
          { id: 'spot_1', name: 'The wooden bench', createdAt: Date.now() - 86400000 * 3 },
          { id: 'spot_2', name: 'Under the oak tree', createdAt: Date.now() - 86400000 * 2 },
        ];
        initial.forEach((s) => saveSpot(s));
        resolve(initial);
      } else {
        resolve(list.sort((a, b) => b.createdAt - a.createdAt));
      }
    };
    req.onerror = () => resolve([]);
  });
}

export async function saveSpot(spot: Spot): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('spots', 'readwrite');
    tx.objectStore('spots').put(spot);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteSpot(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('spots', 'readwrite');
    tx.objectStore('spots').delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// SESSIONS
export async function getSessions(): Promise<Session[]> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('sessions', 'readonly');
    const req = tx.objectStore('sessions').getAll();
    req.onsuccess = () => {
      const list = (req.result as Session[]) || [];
      resolve(list.sort((a, b) => b.startedAt - a.startedAt));
    };
    req.onerror = () => resolve([]);
  });
}

export async function saveSession(session: Session): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sessions', 'readwrite');
    tx.objectStore('sessions').put(session);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ENTRIES
export async function getEntries(): Promise<JournalEntry[]> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('entries', 'readonly');
    const req = tx.objectStore('entries').getAll();
    req.onsuccess = () => {
      const list = (req.result as JournalEntry[]) || [];
      resolve(list.sort((a, b) => b.createdAt - a.createdAt));
    };
    req.onerror = () => resolve([]);
  });
}

export async function saveEntry(entry: JournalEntry): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('entries', 'readwrite');
    tx.objectStore('entries').put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteEntry(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('entries', 'readwrite');
    tx.objectStore('entries').delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// PHOTOS
export async function getPhotos(): Promise<PhotoAsset[]> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('photos', 'readonly');
    const req = tx.objectStore('photos').getAll();
    req.onsuccess = () => {
      const list = (req.result as PhotoAsset[]) || [];
      resolve(list.sort((a, b) => b.createdAt - a.createdAt));
    };
    req.onerror = () => resolve([]);
  });
}

export async function getPhoto(id: string): Promise<PhotoAsset | null> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('photos', 'readonly');
    const req = tx.objectStore('photos').get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => resolve(null);
  });
}

export async function savePhoto(photo: PhotoAsset): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('photos', 'readwrite');
    tx.objectStore('photos').put(photo);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deletePhoto(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('photos', 'readwrite');
    tx.objectStore('photos').delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// SETTINGS
export async function getSettings(): Promise<AppSettings> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('settings', 'readonly');
    const req = tx.objectStore('settings').get('app_settings');
    req.onsuccess = () => {
      if (req.result) {
        resolve({ ...DEFAULT_SETTINGS, ...req.result });
      } else {
        saveSettings(DEFAULT_SETTINGS).then(() => resolve(DEFAULT_SETTINGS));
      }
    };
    req.onerror = () => resolve(DEFAULT_SETTINGS);
  });
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('settings', 'readwrite');
    tx.objectStore('settings').put(settings, 'app_settings');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// EXPORT / IMPORT / RESET
export async function exportAllData(): Promise<string> {
  const spots = await getSpots();
  const sessions = await getSessions();
  const entries = await getEntries();
  const settings = await getSettings();
  const photos = await getPhotos();

  return JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    spots,
    sessions,
    entries,
    settings,
    photos,
  }, null, 2);
}

export async function importAllData(jsonStr: string): Promise<boolean> {
  try {
    const data = JSON.parse(jsonStr);
    const db = await openDB();

    const tx = db.transaction(['spots', 'sessions', 'entries', 'photos', 'settings'], 'readwrite');

    if (Array.isArray(data.spots)) {
      const sStore = tx.objectStore('spots');
      sStore.clear();
      data.spots.forEach((item: Spot) => sStore.put(item));
    }
    if (Array.isArray(data.sessions)) {
      const sessStore = tx.objectStore('sessions');
      sessStore.clear();
      data.sessions.forEach((item: Session) => sessStore.put(item));
    }
    if (Array.isArray(data.entries)) {
      const eStore = tx.objectStore('entries');
      eStore.clear();
      data.entries.forEach((item: JournalEntry) => eStore.put(item));
    }
    if (Array.isArray(data.photos)) {
      const pStore = tx.objectStore('photos');
      pStore.clear();
      data.photos.forEach((item: PhotoAsset) => pStore.put(item));
    }
    if (data.settings) {
      tx.objectStore('settings').put({ ...DEFAULT_SETTINGS, ...data.settings }, 'app_settings');
    }

    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (e) {
    console.error('Failed to import data:', e);
    return false;
  }
}

export async function resetAllData(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['spots', 'sessions', 'entries', 'photos', 'settings'], 'readwrite');
    tx.objectStore('spots').clear();
    tx.objectStore('sessions').clear();
    tx.objectStore('entries').clear();
    tx.objectStore('photos').clear();
    tx.objectStore('settings').clear();
    tx.oncomplete = () => {
      saveSettings(DEFAULT_SETTINGS).then(() => resolve());
    };
    tx.onerror = () => reject(tx.error);
  });
}
