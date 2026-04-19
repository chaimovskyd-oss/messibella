import { supabase } from '@/lib/supabaseClient';
import { getDefaultCollection } from '@/data/defaultContent';

const STORAGE_BUCKET = import.meta.env.VITE_SITE_CONTENT_BUCKET || 'site-content';
const STORAGE_KEY_PREFIX = 'masibala_remote_';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getLocalStorage() {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

function getCollectionPath(entityName) {
  return `${entityName}.json`;
}

function readLocalBackup(entityName, fallback) {
  const storage = getLocalStorage();
  if (!storage) return clone(fallback);

  const stored = storage.getItem(`${STORAGE_KEY_PREFIX}${entityName}`);
  if (!stored) return clone(fallback);

  try {
    return JSON.parse(stored);
  } catch {
    storage.removeItem(`${STORAGE_KEY_PREFIX}${entityName}`);
    return clone(fallback);
  }
}

function writeLocalBackup(entityName, value) {
  const storage = getLocalStorage();
  if (!storage) return;
  storage.setItem(`${STORAGE_KEY_PREFIX}${entityName}`, JSON.stringify(value));
}

function logContentError(action, error, extra = {}) {
  console.error(`Site content ${action} failed`, {
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
    code: error?.code,
    bucket: STORAGE_BUCKET,
    ...extra,
  });
}

export async function getCollection(entityName) {
  const fallback = getDefaultCollection(entityName);
  const path = getCollectionPath(entityName);

  try {
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).download(path);
    if (error) {
      if (error.message?.includes('Object not found')) {
        return readLocalBackup(entityName, fallback);
      }
      throw error;
    }

    const text = await data.text();
    const parsed = JSON.parse(text);
    writeLocalBackup(entityName, parsed);
    return parsed;
  } catch (error) {
    logContentError('download', error, { entityName, path });
    return readLocalBackup(entityName, fallback);
  }
}

export async function saveCollection(entityName, items) {
  const path = getCollectionPath(entityName);
  const payload = clone(items);
  const file = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });

  writeLocalBackup(entityName, payload);

  try {
    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
      upsert: true,
      contentType: 'application/json',
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    logContentError('upload', error, { entityName, path, itemCount: payload.length });
  }

  return payload;
}

function extractExtension(file) {
  const byName = String(file?.name || '').match(/\.([a-zA-Z0-9]+)$/)?.[1];
  if (byName) return byName.toLowerCase();

  const byType = String(file?.type || '').split('/')[1];
  return byType ? byType.toLowerCase() : 'bin';
}

export async function uploadSiteAsset(file, folder = 'site-assets') {
  const extension = extractExtension(file);
  const assetPath = `${folder}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(assetPath, file, {
    upsert: false,
    cacheControl: '3600',
    contentType: file?.type || 'application/octet-stream',
  });

  if (error) {
    logContentError('asset-upload', error, {
      folder,
      fileName: file?.name,
      fileType: file?.type,
      assetPath,
    });
    throw error;
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(assetPath);
  return {
    file_url: data?.publicUrl || '',
    file_path: assetPath,
    file_type: file?.type || 'application/octet-stream',
    original_filename: file?.name || 'file',
  };
}
