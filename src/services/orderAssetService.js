import { supabase } from '@/lib/supabaseClient';

export const ORDER_ASSETS_BUCKET = 'order-assets';
const DEFAULT_SIGNED_URL_TTL = 60 * 60;

function logOrderAssetError(action, error, extra = {}) {
  console.error(`Order asset ${action} failed`, {
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
    code: error?.code,
    bucket: ORDER_ASSETS_BUCKET,
    ...extra,
  });
}

export function isOrderAssetReference(value) {
  return Boolean(
    value
    && typeof value === 'object'
    && (typeof value.file_path === 'string' || typeof value.file_url === 'string')
  );
}

export function toPersistedOrderAsset(value) {
  if (!isOrderAssetReference(value)) return value;

  return {
    file_path: value.file_path || '',
    file_url: typeof value.file_url === 'string' && value.file_url.startsWith('http') ? value.file_url : null,
    original_filename: value.original_filename || 'file',
    file_type: value.file_type || 'application/octet-stream',
    sort_order: Number.isFinite(Number(value.sort_order)) ? Number(value.sort_order) : 0,
  };
}

export async function createOrderAssetSignedUrl(filePath, expiresIn = DEFAULT_SIGNED_URL_TTL) {
  if (!filePath) return '';

  const { data, error } = await supabase.storage
    .from(ORDER_ASSETS_BUCKET)
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    logOrderAssetError('create-signed-url', error, { filePath, expiresIn });
    return '';
  }

  return data?.signedUrl || '';
}

export async function resolveOrderAssetUrl(asset, expiresIn = DEFAULT_SIGNED_URL_TTL) {
  if (!asset) return '';
  if (asset.preview_url) return asset.preview_url;
  if (asset.file_path) {
    const signedUrl = await createOrderAssetSignedUrl(asset.file_path, expiresIn);
    if (signedUrl) return signedUrl;
  }
  if (typeof asset.file_url === 'string') return asset.file_url;
  return '';
}

export async function hydrateOrderAssetReferences(value, expiresIn = DEFAULT_SIGNED_URL_TTL) {
  if (Array.isArray(value)) {
    return Promise.all(value.map(item => hydrateOrderAssetReferences(item, expiresIn)));
  }

  if (isOrderAssetReference(value)) {
    return {
      ...toPersistedOrderAsset(value),
      signed_url: await resolveOrderAssetUrl(value, expiresIn),
    };
  }

  if (value && typeof value === 'object') {
    const entries = await Promise.all(
      Object.entries(value).map(async ([key, entryValue]) => [key, await hydrateOrderAssetReferences(entryValue, expiresIn)])
    );
    return Object.fromEntries(entries);
  }

  return value;
}
