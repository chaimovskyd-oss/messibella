import { supabase } from '@/lib/supabaseClient';

const ORDER_ASSETS_BUCKET = 'order-assets';

function logUploadError(action, error, extra = {}) {
  console.error(`Supabase upload ${action} failed`, {
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
    code: error?.code,
    bucket: ORDER_ASSETS_BUCKET,
    ...extra,
  });
}

function extractExtensionFromName(name) {
  const match = String(name || '').match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toLowerCase() : '';
}

function extractExtensionFromMime(fileType) {
  const normalized = String(fileType || '').toLowerCase();
  if (!normalized.includes('/')) return '';
  const extension = normalized.split('/')[1].split(';')[0].trim();
  return extension === 'jpeg' ? 'jpg' : extension;
}

function resolveExtension(file) {
  return extractExtensionFromName(file?.name) || extractExtensionFromMime(file?.type) || 'bin';
}

function sanitizeAsciiSegment(value, fallback = 'unknown') {
  const sanitized = String(value || '')
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .trim();

  return sanitized || fallback;
}

function sanitizePhoneDigits(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits || 'unknown';
}

function createRandomId() {
  return crypto.randomUUID().replace(/-/g, '');
}

function buildTemporaryPath(file) {
  const extension = resolveExtension(file);
  return `temp/${createRandomId()}.${extension}`;
}

function buildFinalPath({ orderNumber, phone, extension }) {
  const safeOrderNumber = sanitizeAsciiSegment(orderNumber, 'unknown-order');
  const safePhone = sanitizePhoneDigits(phone);
  const safeExtension = sanitizeAsciiSegment(extension, 'bin').toLowerCase();
  return `orders/${safeOrderNumber}/${safePhone}/${createRandomId()}.${safeExtension}`;
}

function getPublicUrl(filePath) {
  const { data } = supabase.storage.from(ORDER_ASSETS_BUCKET).getPublicUrl(filePath);
  return data?.publicUrl || '';
}

export function isStorageAssetReference(value) {
  return value && typeof value === 'object' && typeof value.file_url === 'string' && value.file_url.length > 0;
}

export async function uploadOrderAsset(file) {
  const filePath = buildTemporaryPath(file);

  const { error: uploadError } = await supabase.storage
    .from(ORDER_ASSETS_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file?.type || 'application/octet-stream',
    });

  if (uploadError) {
    logUploadError('upload', uploadError, {
      fileName: file?.name,
      fileType: file?.type,
      filePath,
    });
    throw uploadError;
  }

  return {
    file_url: getPublicUrl(filePath),
    file_path: filePath,
    original_filename: file?.name || 'file',
    file_type: file?.type || 'application/octet-stream',
  };
}

async function moveAssetToOrderPath(asset, context) {
  if (!isStorageAssetReference(asset)) return asset;
  if (!String(asset.file_path || '').startsWith('temp/')) return asset;

  const extension = resolveExtension({
    name: asset.original_filename,
    type: asset.file_type,
  });
  const targetPath = buildFinalPath({
    orderNumber: context.orderNumber,
    phone: context.phone,
    extension,
  });

  const { error: moveError } = await supabase.storage
    .from(ORDER_ASSETS_BUCKET)
    .move(asset.file_path, targetPath);

  if (moveError) {
    logUploadError('move', moveError, {
      sourcePath: asset.file_path,
      targetPath,
      orderNumber: context.orderNumber,
      phone: context.phone,
    });
    throw moveError;
  }

  return {
    ...asset,
    file_path: targetPath,
    file_url: getPublicUrl(targetPath),
  };
}

async function finalizeValue(value, context) {
  if (Array.isArray(value)) {
    return Promise.all(value.map(item => finalizeValue(item, context)));
  }

  if (isStorageAssetReference(value)) {
    return moveAssetToOrderPath(value, context);
  }

  if (value && typeof value === 'object') {
    const entries = await Promise.all(
      Object.entries(value).map(async ([key, entryValue]) => [key, await finalizeValue(entryValue, context)])
    );
    return Object.fromEntries(entries);
  }

  return value;
}

export async function finalizeOrderAssetReferences(customizationData, context) {
  return finalizeValue(customizationData, context);
}
