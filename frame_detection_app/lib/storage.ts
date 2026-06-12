import type { ImageLabels } from "@/components/labeling-canvas";

// indexeddb can store handles unlike localstorage
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("paai-labeling", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("handles");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// skip the picker on next visit
export async function storeDirHandle(
  handle: FileSystemDirectoryHandle
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("handles", "readwrite");
    // one active folder at a time
    tx.objectStore("handles").put(handle, "dir");
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

// null means fresh session, not an error
export async function getStoredDirHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("handles", "readonly");
      const req = tx.objectStore("handles").get("dir");
      req.onsuccess = () => { db.close(); resolve(req.result ?? null); };
      req.onerror = () => { db.close(); reject(req.error); };
    });
  } catch {
    // private browsing can block indexeddb
    return null;
  }
}

// labels live in the folder so they travel with the images
export async function readLabelsFromDir(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dir: any
): Promise<Record<string, ImageLabels>> {
  try {
    const fh = await dir.getFileHandle("labels.json");
    const file = await fh.getFile();
    const arr = JSON.parse(await file.text()) as Array<{
      filename: string;
      top?: { x: number; y: number };
      right?: { x: number; y: number };
      bottom?: { x: number; y: number };
      left?: { x: number; y: number };
    }>;
    // index by filename for fast lookup
    const map: Record<string, ImageLabels> = {};
    for (const entry of arr) {
      map[entry.filename] = {
        top:    entry.top,
        right:  entry.right,
        bottom: entry.bottom,
        left:   entry.left,
      };
    }
    return map;
  } catch {
    // no labels.json yet, start clean
    return {};
  }
}
