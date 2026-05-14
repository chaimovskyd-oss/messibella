import urlToLocal from '@/data/images_mapping.json';

export const WHATSAPP_NUMBER = '972559891243';

export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='900' height='1100' viewBox='0 0 900 1100'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop stop-color='%23fff7ed'/%3E%3Cstop offset='.5' stop-color='%23fdf2f8'/%3E%3Cstop offset='1' stop-color='%23ecfeff'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='900' height='1100' rx='54' fill='url(%23g)'/%3E%3Ccircle cx='694' cy='248' r='126' fill='%23ffffff' fill-opacity='.72'/%3E%3Crect x='166' y='374' width='568' height='352' rx='36' fill='%23ffffff' fill-opacity='.76'/%3E%3Cpath d='M248 636l113-134 80 90 61-70 150 114' fill='none' stroke='%23d8b4fe' stroke-width='28' stroke-linecap='round' stroke-linejoin='round'/%3E%3Ccircle cx='546' cy='486' r='38' fill='%23f9a8d4'/%3E%3Ctext x='450' y='818' text-anchor='middle' font-family='Arial,sans-serif' font-size='34' font-weight='700' fill='%2394a3b8'%3EMessibella%3C/text%3E%3C/svg%3E";

const GENERIC_CATEGORY = 'Catalog Favorites';
const SECTION_THEMES = [
  'blush',
  'mint',
  'butter',
  'sky',
  'rose',
  'linen',
];

export function resolveImagePath(imageOrPath) {
  if (!imageOrPath) return PLACEHOLDER_IMAGE;

  const raw = typeof imageOrPath === 'string'
    ? imageOrPath
    : imageOrPath.local_filename || imageOrPath.localFilename || imageOrPath.src || imageOrPath.url || imageOrPath.href;

  if (!raw || typeof raw !== 'string') return PLACEHOLDER_IMAGE;

  const mapped = raw.includes('messibella.co.il/image/cache') ? urlToLocal[raw] : null;
  const value = mapped || raw;

  if (/^https?:\/\//i.test(value)) return PLACEHOLDER_IMAGE;
  if (value.startsWith('data:') || value.startsWith('blob:')) return value;

  const normalized = value.replaceAll('\\\\', '/').replaceAll('\\', '/').replace(/^\/+/, '');
  if (!normalized) return PLACEHOLDER_IMAGE;
  return `/${normalized}`;
}

export function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function generateStableId(product, index = 0) {
  const value = product?.product_id || product?.id || product?.slug || product?.name || `product-${index}`;
  return String(value);
}

export function cleanText(value, max = 180) {
  const text = String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!max || text.length <= max) return text;
  return `${text.slice(0, max).trim()}...`;
}

export function formatPrice(product) {
  const amount = product?.current_price?.amount ?? product?.base_price ?? product?.price;
  if (Number.isFinite(Number(amount)) && Number(amount) > 0) {
    return `₪${Number(amount).toLocaleString('he-IL')}`;
  }
  return 'Price on request';
}

export function createWhatsAppUrl(product) {
  const name = product?.name || 'this product';
  const text = encodeURIComponent(`Hi, I would like details about ${name}`);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

export function getProductImages(product) {
  const fromImages = Array.isArray(product?.images) ? product.images : [];
  const fromGallery = Array.isArray(product?.gallery)
    ? product.gallery.map((src) => ({ src }))
    : [];
  const fromDesigns = Array.isArray(product?.designs)
    ? product.designs.flatMap((design) => Array.isArray(design.images) ? design.images : [])
    : [];

  const candidates = [...fromImages, ...fromGallery, ...fromDesigns]
    .map((image) => resolveImagePath(image))
    .filter((src) => src && src !== PLACEHOLDER_IMAGE);

  return unique(candidates).slice(0, 18);
}

export function getProductMainImage(product) {
  const main = Array.isArray(product?.images)
    ? product.images.find((image) => image?.role === 'main' && image?.local_filename) ||
      product.images.find((image) => image?.local_filename)
    : null;

  return resolveImagePath(main) !== PLACEHOLDER_IMAGE
    ? resolveImagePath(main)
    : getProductImages(product)[0] || PLACEHOLDER_IMAGE;
}

export function mapProduct(product, index = 0) {
  const id = generateStableId(product, index);
  const categoryPath = Array.isArray(product?.category_path)
    ? unique(product.category_path.filter(Boolean))
    : [product?.category_path].filter(Boolean);
  const categoryName = categoryPath[0] || GENERIC_CATEGORY;
  const tags = unique([
    ...(Array.isArray(product?.tags) ? product.tags : []),
    ...categoryPath.slice(0, 3),
    product?.availability,
  ].filter(Boolean)).slice(0, 7);

  return {
    ...product,
    id,
    slug: slugify(product?.slug || product?.name || id),
    categoryName,
    categoryPath,
    title: product?.name || 'Untitled product',
    description: cleanText(product?.short_description || product?.full_description, 220),
    longDescription: cleanText(product?.full_description || product?.short_description, 900),
    priceLabel: formatPrice(product),
    tags,
    images: getProductImages(product),
    mainImage: getProductMainImage(product),
    searchText: [
      product?.name,
      product?.slug,
      product?.short_description,
      product?.full_description,
      product?.availability,
      ...tags,
      ...categoryPath,
    ].filter(Boolean).join(' ').toLowerCase(),
  };
}

export function buildCategoryChapters(products) {
  const grouped = new Map();

  products.forEach((product) => {
    const key = product.categoryName || GENERIC_CATEGORY;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(product);
  });

  return Array.from(grouped.entries())
    .map(([title, items], index) => ({
      id: `chapter-${slugify(title) || index}`,
      title,
      subtitle: createChapterSubtitle(title, items),
      page: index * 6 + 4,
      theme: SECTION_THEMES[index % SECTION_THEMES.length],
      products: uniqueBy(items, (product) => product.id).slice(0, 64),
    }))
    .filter((chapter) => chapter.products.length > 0);
}

export function normalizeCatalog(rawCatalog) {
  const rawProducts = Array.isArray(rawCatalog?.products) ? rawCatalog.products : [];
  const products = rawProducts
    .map(mapProduct)
    .filter((product) => product.title && product.mainImage !== PLACEHOLDER_IMAGE);

  const chapters = buildCategoryChapters(products);

  return {
    baseUrl: rawCatalog?.base_url || '',
    products,
    chapters,
    featured: products
      .filter((product) => product.images.length > 0)
      .slice(0, 8),
  };
}

export function searchCatalog(chapters, query) {
  const value = query.trim().toLowerCase();
  if (!value) return chapters;

  return chapters
    .map((chapter) => ({
      ...chapter,
      products: chapter.products.filter((product) =>
        product.searchText.includes(value) ||
        chapter.title.toLowerCase().includes(value)
      ),
    }))
    .filter((chapter) => chapter.products.length > 0);
}

export function unique(values) {
  return Array.from(new Set(values));
}

function uniqueBy(values, keyFn) {
  const seen = new Set();
  return values.filter((value) => {
    const key = keyFn(value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function createChapterSubtitle(title, items) {
  const count = items.length.toLocaleString('he-IL');
  const lower = title.toLowerCase();

  if (lower.includes('family') || title.includes('משפחה')) return `${count} personal keepsakes for warm family moments`;
  if (lower.includes('drink') || title.includes('בקבוק')) return `${count} useful gifts with a personal everyday touch`;
  if (lower.includes('bag') || title.includes('תיק')) return `${count} bags, sets and school-ready ideas`;
  if (lower.includes('holiday') || title.includes('חג')) return `${count} seasonal pieces for celebrations and hosts`;

  return `${count} gift ideas collected into this chapter`;
}
