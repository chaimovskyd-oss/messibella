import urlToLocal from '@/data/images_mapping.json';

const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='400' height='400' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23d1d5db' font-size='48'%3E%F0%9F%96%BC%3C/text%3E%3C/svg%3E";

/**
 * Resolves a product image source to a working URL.
 *
 * Priority:
 *  1. Already a local path (images\... or /images/...) → normalise slashes + add leading "/"
 *  2. Old messibella.co.il OpenCart URL → look up in migrated mapping
 *  3. Any other http(s) URL (Supabase, CDN, blob) → pass through as-is
 *  4. Fallback → placeholder SVG data-URI
 */
export function resolveProductImage(src) {
  if (!src || typeof src !== 'string') return PLACEHOLDER;

  // Already a local images/ path — normalise and return
  if (src.startsWith('images/') || src.startsWith('images\\')) {
    return '/' + src.replace(/\\/g, '/');
  }
  if (src.startsWith('/images/')) {
    return src;
  }

  // Old OpenCart origin — look up in migrated mapping
  if (src.includes('messibella.co.il')) {
    const local = urlToLocal[src];
    if (local) return '/' + local.replace(/\\/g, '/');
    return PLACEHOLDER;
  }

  // Supabase / CDN / blob / data-URI — pass through
  if (src.startsWith('http') || src.startsWith('blob:') || src.startsWith('data:')) {
    return src;
  }

  return PLACEHOLDER;
}
