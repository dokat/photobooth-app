/**
 * OPFS-based photo cache.
 * Images are stored in the Origin Private File System under "photobooth-images/".
 * The photo_id (which may contain "/") is sanitised to a flat filename.
 */

const CACHE_DIR = "photobooth-images";

/** Returns the OPFS directory used for caching, creating it if absent. */
async function getCacheDir(): Promise<FileSystemDirectoryHandle> {
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle(CACHE_DIR, { create: true });
}

/** Sanitise a photo_id that may contain "/" into a safe filename. */
function toFileName(photoId: string): string {
  return photoId.replace(/\//g, "_");
}

/**
 * Returns a blob: URL if the photo is cached in OPFS, otherwise null.
 * The caller is responsible for revoking the returned URL when done.
 */
export async function getPhotoFromCache(photoId: string): Promise<string | null> {
  try {
    const dir = await getCacheDir();
    const fileHandle = await dir.getFileHandle(toFileName(photoId));
    const file = await fileHandle.getFile();
    return URL.createObjectURL(file);
  } catch {
    // File does not exist or OPFS unavailable
    return null;
  }
}

/**
 * Saves a blob to OPFS and returns a blob: URL for immediate use.
 * The caller is responsible for revoking the returned URL when done.
 */
export async function savePhotoToCache(photoId: string, blob: Blob): Promise<string> {
  const dir = await getCacheDir();
  const fileHandle = await dir.getFileHandle(toFileName(photoId), { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
  return URL.createObjectURL(blob);
}

/** Removes a cached photo from OPFS. Safe to call even if the file is absent. */
export async function removePhotoFromCache(photoId: string): Promise<void> {
  try {
    const dir = await getCacheDir();
    await dir.removeEntry(toFileName(photoId));
  } catch {
    // File may not exist — ignore
  }
}
