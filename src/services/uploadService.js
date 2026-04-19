import { supabase } from '@/lib/supabaseClient';
import { isOrderAssetReference, ORDER_ASSETS_BUCKET, toPersistedOrderAsset } from '@/services/orderAssetService';

function isFileInstance(value) {
  return typeof File !== 'undefined' && value instanceof File;
}

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
  return digits || 'unknown-phone';
}

function createRandomId() {
  return crypto.randomUUID();
}

export function buildFinalOrderAssetPath({ orderNumber, phone, file }) {
  const extension = sanitizeAsciiSegment(resolveExtension(file), 'bin').toLowerCase();
  const safeOrderNumber = sanitizeAsciiSegment(orderNumber, 'unknown-order');
  const safePhone = sanitizePhoneDigits(phone);
  return `orders/${safeOrderNumber}/${safePhone}/${createRandomId()}.${extension}`;
}

export function createPendingOrderAsset(file) {
  return {
    file_path: '',
    file_url: null,
    preview_url: typeof URL !== 'undefined' ? URL.createObjectURL(file) : '',
    original_filename: file?.name || 'file',
    file_type: file?.type || 'application/octet-stream',
    pending_file: file,
  };
}

export async function uploadOrderAsset(file, context) {
  if (!context?.orderNumber) {
    const missingContextError = new Error('Cannot upload order asset without orderNumber');
    logUploadError('missing-order-context', missingContextError, {
      fileName: file?.name,
      fileType: file?.type,
      context,
    });
    throw missingContextError;
  }

  const filePath = buildFinalOrderAssetPath({
    orderNumber: context.orderNumber,
    phone: context.phone,
    file,
  });

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(ORDER_ASSETS_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file?.type || 'application/octet-stream',
    });

  if (uploadError) {
    logUploadError('upload-final', uploadError, {
      fileName: file?.name,
      fileType: file?.type,
      filePath,
      orderNumber: context.orderNumber,
      phone: context.phone,
    });
    throw uploadError;
  }

  const storedPath = uploadData?.path || filePath;

  if (!storedPath) {
    const missingPathError = new Error('Supabase upload completed without a stored file path');
    logUploadError('missing-stored-path', missingPathError, {
      fileName: file?.name,
      fileType: file?.type,
      filePath,
      uploadData,
      context,
    });
    throw missingPathError;
  }

  console.log('Supabase order asset upload result', {
    bucket: ORDER_ASSETS_BUCKET,
    requestedPath: filePath,
    storedPath,
    uploadData,
    fileName: file?.name,
    fileType: file?.type,
    orderNumber: context.orderNumber,
    phone: context.phone,
  });

  return {
    file_path: storedPath,
    file_url: null,
    original_filename: file?.name || 'file',
    file_type: file?.type || 'application/octet-stream',
  };
}

export function isStorageAssetReference(value) {
  return isOrderAssetReference(value);
}

async function finalizeValue(value, context) {
  if (Array.isArray(value)) {
    return Promise.all(value.map(item => finalizeValue(item, context)));
  }

  if (isStorageAssetReference(value)) {
    if (isFileInstance(value.pending_file)) {
      console.log('Order asset before upload', {
        orderNumber: context?.orderNumber,
        phone: context?.phone,
        asset: {
          file_path: value.file_path || '',
          file_url: value.file_url || null,
          preview_url: value.preview_url || '',
          original_filename: value.original_filename || 'file',
          file_type: value.file_type || 'application/octet-stream',
          sort_order: value.sort_order ?? 0,
          hasPendingFile: true,
        },
      });

      const uploadedAsset = await uploadOrderAsset(value.pending_file, context);
      const finalizedAsset = {
        ...uploadedAsset,
        sort_order: value.sort_order ?? 0,
      };

      console.log('Order asset after upload', {
        orderNumber: context?.orderNumber,
        phone: context?.phone,
        asset: finalizedAsset,
      });

      return finalizedAsset;
    }

    if (!value.file_path && !value.file_url) {
      const missingAssetError = new Error('Order asset reference is missing both file_path and file_url');
      logUploadError('invalid-asset-reference', missingAssetError, {
        orderNumber: context?.orderNumber,
        phone: context?.phone,
        asset: {
          file_path: value?.file_path || '',
          file_url: value?.file_url || null,
          preview_url: value?.preview_url || '',
          original_filename: value?.original_filename || 'file',
          file_type: value?.file_type || 'application/octet-stream',
          sort_order: value?.sort_order ?? 0,
          hasPendingFile: false,
        },
      });
      throw missingAssetError;
    }

    return toPersistedOrderAsset(value);
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
