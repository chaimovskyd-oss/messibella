export const PLACEHOLDER_IMAGE = "/images/placeholder-product.svg";

function normalizeLocalPath(path) {
  if (!path) return null;
  const cleaned = String(path).replaceAll("\\\\", "/").replaceAll("\\", "/").trim();
  return cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
}

function normalizeUrl(raw) {
  if (!raw) return null;
  const value = String(raw).trim();
  if (!value) return null;
  const withoutQuery = value.split(/[?#]/)[0];
  const normalized = withoutQuery.startsWith("//") ? `https:${withoutQuery}` : withoutQuery;
  return normalized.toLowerCase();
}

function extractFilename(value) {
  if (!value) return "";
  const parts = String(value).split("/");
  return parts[parts.length - 1].toLowerCase();
}

function stripSizeSuffix(filename) {
  if (!filename) return "";
  return String(filename).replace(/(-\d+x\d+)(\.[a-z0-9]{2,5})$/i, "$2");
}

function isOpenCartUrl(url) {
  return typeof url === "string" && /messibella\.co\.il\/image\//i.test(url);
}

function imageUrlMatches(urlA, urlB) {
  if (!urlA || !urlB) return false;
  const a = normalizeUrl(urlA);
  const b = normalizeUrl(urlB);
  return a === b;
}

function getImageMatchValues(image) {
  return [
    image?.design_label || image?.designLabel,
    image?.variant_key || image?.variantKey,
    image?.alt_text || image?.altText,
    image?.sort_order || image?.sortOrder,
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());
}

function findLocalMatch(image, product) {
  if (!product || !Array.isArray(product.images) || !product.images.length) return null;

  const rawUrl = normalizeUrl(image?.image_url || image?.imageUrl || image?.url);
  const rawFilename = extractFilename(rawUrl);
  const rawBase = stripSizeSuffix(rawFilename);
  const matchValues = getImageMatchValues(image);

  for (const candidate of product.images) {
    const candidateUrl = normalizeUrl(candidate?.image_url || candidate?.imageUrl || candidate?.url);
    const candidateLocal = candidate.local_filename || candidate.localFilename;
    const candidateFilename = extractFilename(candidateUrl || candidateLocal);
    const candidateBase = stripSizeSuffix(candidateFilename);
    const candidateValues = getImageMatchValues(candidate);

    if (rawUrl && candidateUrl && imageUrlMatches(candidateUrl, rawUrl) && candidateLocal) {
      return { path: normalizeLocalPath(candidateLocal), matchedProductImage: candidate };
    }

    if (rawBase && candidateBase && rawBase === candidateBase && candidateLocal) {
      return { path: normalizeLocalPath(candidateLocal), matchedProductImage: candidate };
    }

    if (matchValues.length && candidateLocal) {
      const candidateText = [
        candidateLocal,
        candidate?.alt_text || candidate?.altText,
        candidate?.variant_key || candidate?.variantKey,
        candidate?.design_label || candidate?.designLabel,
        candidate?.sort_order || candidate?.sortOrder,
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase())
        .join(" ");

      if (matchValues.some((value) => candidateText.includes(value))) {
        return { path: normalizeLocalPath(candidateLocal), matchedProductImage: candidate };
      }

      if (candidateValues.length && candidateLocal) {
        const imageText = matchValues.join(" ");
        if (candidateValues.some((value) => imageText.includes(value))) {
          return { path: normalizeLocalPath(candidateLocal), matchedProductImage: candidate };
        }
      }
    }
  }

  return null;
}

export function resolveImagePath(imageOrPath) {
  if (!imageOrPath) return PLACEHOLDER_IMAGE;

  if (typeof imageOrPath === "string") {
    if (imageOrPath.startsWith("/")) return imageOrPath;
    if (/^https?:\/\//.test(imageOrPath)) return imageOrPath;
    return normalizeLocalPath(imageOrPath);
  }

  const local = imageOrPath.local_filename || imageOrPath.localFilename;
  if (local) return normalizeLocalPath(local);

  const remote = normalizeUrl(imageOrPath.image_url || imageOrPath.imageUrl || imageOrPath.url);
  if (remote) {
    if (remote.startsWith("/")) return remote;
    if (/^https?:\/\//.test(remote)) return remote;
    return normalizeLocalPath(remote);
  }

  return PLACEHOLDER_IMAGE;
}

export function resolveCatalogImage(imageOrPath, product) {
  if (!imageOrPath) return PLACEHOLDER_IMAGE;

  const originalLocalFilename = imageOrPath?.local_filename || imageOrPath?.localFilename || null;
  const originalImageUrl = imageOrPath?.image_url || imageOrPath?.imageUrl || imageOrPath?.url || null;
  const designName = imageOrPath?.design_name || imageOrPath?.design_label || imageOrPath?.variant_key || imageOrPath?.variantKey || null;

  const debugInfo = {
    productName: product?.name || null,
    designName,
    originalImageUrl,
    localFilename: originalLocalFilename,
    matchedProductImage: null,
    resolvedPath: null,
    fallbackReason: null,
  };

  if (typeof imageOrPath === "string") {
    if (isOpenCartUrl(imageOrPath)) {
      debugInfo.resolvedPath = PLACEHOLDER_IMAGE;
      debugInfo.fallbackReason = "openCart URL forbidden";
      if (process.env.NODE_ENV !== "production") console.log({ designImageResolution: debugInfo });
      return PLACEHOLDER_IMAGE;
    }

    const resolved = resolveImagePath(imageOrPath);
    debugInfo.resolvedPath = resolved;
    debugInfo.fallbackReason = "string path";
    if (process.env.NODE_ENV !== "production") console.log({ designImageResolution: debugInfo });
    return resolved;
  }

  if (originalLocalFilename) {
    const resolved = normalizeLocalPath(originalLocalFilename);
    debugInfo.resolvedPath = resolved;
    debugInfo.fallbackReason = "local_filename";
    if (process.env.NODE_ENV !== "production") console.log({ designImageResolution: debugInfo });
    return resolved;
  }

  const localMatch = findLocalMatch(imageOrPath, product);
  if (localMatch) {
    debugInfo.matchedProductImage = localMatch.matchedProductImage || null;
    debugInfo.resolvedPath = localMatch.path;
    debugInfo.fallbackReason = "matched product.images local_filename";
    if (process.env.NODE_ENV !== "production") console.log({ designImageResolution: debugInfo });
    return localMatch.path;
  }

  const remote = normalizeUrl(originalImageUrl);
  if (remote && !isOpenCartUrl(remote)) {
    debugInfo.resolvedPath = remote;
    debugInfo.fallbackReason = "remote non-openCart URL";
    if (process.env.NODE_ENV !== "production") console.log({ designImageResolution: debugInfo });
    return remote;
  }

  debugInfo.resolvedPath = PLACEHOLDER_IMAGE;
  debugInfo.fallbackReason = remote ? "openCart URL fallback" : "no image data";
  if (process.env.NODE_ENV !== "production") console.log({ designImageResolution: debugInfo });
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
