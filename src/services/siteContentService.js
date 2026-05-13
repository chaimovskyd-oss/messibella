import { supabase } from '@/lib/supabaseClient';
import { getDefaultCollection } from '@/data/defaultContent';

const STORAGE_BUCKET = import.meta.env.VITE_SITE_CONTENT_BUCKET || 'site-content';
const STORAGE_KEY_PREFIX = 'masibala_remote_';

// Supabase is considered "configured" only when both env vars are present at
// build time. Without them the client still constructs but all requests fail.
const SUPABASE_ENABLED =
  !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_KEY;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getLocalStorage() {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
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

/**
 * Load a collection using a three-tier priority:
 *
 *  1. Static local file  /data/<EntityName>.json  (always works in production,
 *     populated by scripts/generate-static-content.js and served via publicDir)
 *  2. Supabase storage   (optional — only when VITE_SUPABASE_URL/KEY are set,
 *     used to pick up live admin edits without a redeploy)
 *  3. In-memory defaults from src/data/ and defaultContent.js
 */
export async function getCollection(entityName) {
  const fallback = getDefaultCollection(entityName);

  // ── 1. Static local file ────────────────────────────────────────────────
  try {
    const res = await fetch(`/data/${entityName}.json`);
    if (res.ok) {
      const parsed = await res.json();
      // Warm the localStorage cache so Supabase writes are still visible if
      // the user subsequently updates content through the admin panel.
      writeLocalBackup(entityName, parsed);
      return parsed;
    }
  } catch {
    // file not found or network error — continue to next tier
  }

  // ── 2. Supabase storage (optional) ──────────────────────────────────────
  if (SUPABASE_ENABLED) {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .download(`${entityName}.json`);

      if (!error && data) {
        const text = await data.text();
        const parsed = JSON.parse(text);
        writeLocalBackup(entityName, parsed);
        return parsed;
      }
    } catch (error) {
      logContentError('download', error, { entityName });
    }
  }

  // ── 3. localStorage backup or in-memory defaults ─────────────────────────
  return readLocalBackup(entityName, fallback);
}

export async function saveCollection(entityName, items) {
  const payload = clone(items);
  const file = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });

  writeLocalBackup(entityName, payload);

  if (!SUPABASE_ENABLED) {
    console.warn(`saveCollection(${entityName}): Supabase not configured — saved to localStorage only.`);
    return payload;
  }

  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(`${entityName}.json`, file, {
        upsert: true,
        contentType: 'application/json',
      });

    if (error) throw error;
  } catch (error) {
    logContentError('upload', error, { entityName, itemCount: payload.length });
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
  if (!SUPABASE_ENABLED) {
    throw new Error('uploadSiteAsset: Supabase is not configured.');
  }

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
