export const PLACEHOLDER_IMAGE = "/images/placeholder-product.svg";

export function resolveImagePath(imageOrPath) {
  if (!imageOrPath) return PLACEHOLDER_IMAGE;

  if (typeof imageOrPath === "string") {
    if (imageOrPath.startsWith("/")) return imageOrPath;
    return "/" + String(imageOrPath).replaceAll("\\\\", "/").replaceAll("\\", "/");
  }

  const local = imageOrPath.local_filename || imageOrPath.localFilename;
  if (local) return "/" + String(local).replaceAll("\\\\", "/").replaceAll("\\", "/");

  return PLACEHOLDER_IMAGE;
}

export function normalizeSlug(slug, fallback) {
  if (!slug) return slugify(String(fallback || "product"));
  return slugify(String(slug));
}

export function slugify(text) {
  return String(text || "").toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9א-ת\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function generateStableId(product) {
  if (product.product_id) return String(product.product_id);
  if (product.id) return String(product.id);
  const base = (product.slug || product.name || JSON.stringify(product)).slice(0, 60);
  return `p_${Math.abs(hashCode(base))}`;
}

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return h;
}

export function cleanCatalog(catalog) {
  const products = Array.isArray(catalog.products) ? catalog.products : [];

  const cleaned = products.map((p) => {
    const prod = { ...p };
    prod.product_id = generateStableId(prod);
    prod.slug = normalizeSlug(prod.slug, prod.name || prod.product_id);

    if (Array.isArray(prod.images)) {
      prod.images = prod.images
        .map((img) => ({ ...img }))
        .filter(Boolean)
        .map((img) => {
          if (img.local_filename) img.local_filename = String(img.local_filename).replaceAll('\\\\', '/').replaceAll('\\', '/');
          return img;
        });
    } else prod.images = [];

    if (Array.isArray(prod.designs)) {
      prod.designs = prod.designs.map((d) => {
        const copy = { ...d };
        if (Array.isArray(copy.images)) {
          copy.images = copy.images.map((img) => {
            const out = { ...img };
            if (out.local_filename) out.local_filename = String(out.local_filename).replaceAll('\\\\', '/').replaceAll('\\', '/');
            return out;
          });
        }
        return copy;
      });
    }

    return prod;
  });

  // build categories (first element of category_path) and dedupe
  const categories = [...new Set(cleaned.map((p) => (Array.isArray(p.category_path) ? p.category_path[0] : p.category_path) || 'קטלוג כללי'))];

  const out = { ...catalog, products: cleaned, categories };
  return out;
}
