import urlToLocal from '@/data/images_mapping.json';

export const WHATSAPP_NUMBER = '972559891243';

export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='900' height='1100' viewBox='0 0 900 1100'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop stop-color='%23fff7ed'/%3E%3Cstop offset='.5' stop-color='%23fdf2f8'/%3E%3Cstop offset='1' stop-color='%23ecfeff'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='900' height='1100' rx='54' fill='url(%23g)'/%3E%3Ccircle cx='694' cy='248' r='126' fill='%23ffffff' fill-opacity='.72'/%3E%3Crect x='166' y='374' width='568' height='352' rx='36' fill='%23ffffff' fill-opacity='.76'/%3E%3Cpath d='M248 636l113-134 80 90 61-70 150 114' fill='none' stroke='%23d8b4fe' stroke-width='28' stroke-linecap='round' stroke-linejoin='round'/%3E%3Ccircle cx='546' cy='486' r='38' fill='%23f9a8d4'/%3E%3Ctext x='450' y='818' text-anchor='middle' font-family='Arial,sans-serif' font-size='34' font-weight='700' fill='%2394a3b8'%3EMessibella%3C/text%3E%3C/svg%3E";

const GENERIC_CATEGORY = 'שונות';
const SECTION_THEMES = ['blush', 'mint', 'butter', 'sky', 'rose', 'linen'];

export const SORT_OPTIONS = [
  { value: 'recommended', label: 'מומלצים' },
  { value: 'price-asc', label: 'מחיר נמוך' },
  { value: 'price-desc', label: 'מחיר גבוה' },
  { value: 'designs', label: 'הכי הרבה עיצובים' },
  { value: 'name', label: 'א-ב' },
];

const CATEGORY_RULES = [
  { id: 'sets', label: 'סטים לגן', keywords: ['סט', 'תואמים', 'בקבוק + קופסת אוכל', 'תיק גן +'] },
  { id: 'bags', label: 'תיקים', keywords: ['תיק גן', 'תיק שרוך', 'תיק חוג', 'תיק'] },
  { id: 'bottles', label: 'בקבוקים', keywords: ['בקבוק', 'תרמי', 'ספורט נירוסטה'] },
  { id: 'food-boxes', label: 'קופסאות אוכל וכלים', keywords: ['קופסת אוכל', 'ספל', 'כוס', 'צלחת'] },
  { id: 'end-year', label: 'מתנות סוף שנה וימי הולדת', keywords: ['סוף שנה', 'יום הולדת', 'ימי הולדת', 'מתנות לגן'] },
  { id: 'staff', label: 'מתנות לצוות', keywords: ['צוות', 'גננת', 'סייעת', 'מורה'] },
  { id: 'holidays', label: 'חגים ומועדים', keywords: ['חגים', 'ראש השנה', 'פסח', 'פורים', 'משלוח מנות', 'חנוכה'] },
  { id: 'home-family', label: 'לבית ולמשפחה', keywords: ['משפחה', 'לבית', 'לאם', 'מסגרת', 'שעון', 'הדום', 'כורסא'] },
  { id: 'accessories', label: 'אביזרים ומתנות קטנות', keywords: ['מחזיק מפתחות', 'משקפי שמש', 'כיסוי', 'קלמר', 'מגבת', 'כיסא חוף', 'חולצה לרכב'] },
  { id: 'deals', label: 'מבצעים', keywords: ['מבצעים'] },
];

const FAMILY_RULES = [
  { key: 'gan-bags', title: 'תיקי גן ממותגים', keywords: ['תיק גן'] },
  { key: 'drawstring-bags', title: 'תיקי שרוך', keywords: ['תיק שרוך'] },
  { key: 'garden-sets', title: 'סטים תואמים לגן', keywords: ['תואמים', 'תיק גן +', 'סט'] },
  { key: 'bottles', title: 'בקבוקים ממותגים', keywords: ['בקבוק'] },
  { key: 'food-boxes', title: 'קופסאות אוכל', keywords: ['קופסת אוכל'] },
  { key: 'cups', title: 'ספלים וכוסות לילדים', keywords: ['ספל', 'כוס'] },
  { key: 'towels', title: 'מגבות וקפוצ׳ונים', keywords: ['מגבת', 'קפוצ'] },
  { key: 'keychains', title: 'מחזיקי מפתחות', keywords: ['מחזיק מפתחות'] },
  { key: 'sunglasses', title: 'משקפי שמש וכיסויים', keywords: ['משקפי שמש'] },
  { key: 'beach-chairs', title: 'כיסאות חוף ממותגים', keywords: ['כיסא חוף'] },
  { key: 'purim', title: 'פורים ומשלוחי מנות', keywords: ['פורים', 'משלוח מנות'] },
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
  return `${String(value)}-${index}`;
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
  const amount = getPriceAmount(product);
  return amount ? `₪${amount.toLocaleString('he-IL')}` : 'מחיר לפי הזמנה';
}

export function createWhatsAppUrl(product) {
  const name = product?.name || product?.title || 'מוצר מהקטלוג';
  const text = encodeURIComponent(`היי, אשמח לקבל פרטים על ${name}`);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

export function getProductImages(product) {
  const fromImages = Array.isArray(product?.images) ? product.images : [];
  const fromGallery = Array.isArray(product?.gallery) ? product.gallery.map((src) => ({ src })) : [];
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
  const primaryCategory = getPrimaryCategory(product, categoryPath);
  const family = getProductFamily(product, categoryPath);
  const priceAmount = getPriceAmount(product);
  const tags = unique([
    ...(Array.isArray(product?.tags) ? product.tags : []),
    primaryCategory.label,
    ...categoryPath.slice(0, 3),
    product?.availability,
  ].filter(Boolean)).slice(0, 7);

  return {
    ...product,
    id,
    slug: slugify(product?.slug || product?.name || id),
    categoryName,
    categoryPath,
    primaryCategory,
    familyKey: family.key,
    familyTitle: family.title,
    priceAmount,
    title: product?.name || 'מוצר ללא שם',
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
      primaryCategory.label,
      family.title,
      ...tags,
      ...categoryPath,
    ].filter(Boolean).join(' ').toLowerCase(),
  };
}

export function buildCategoryChapters(products) {
  const grouped = new Map();

  products.forEach((product) => {
    const key = product.primaryCategory?.label || product.categoryName || GENERIC_CATEGORY;
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
      products: sortProducts(uniqueBy(items, (product) => product.id), 'recommended'),
    }))
    .filter((chapter) => chapter.products.length > 0)
    .sort((a, b) => categoryOrder(a.title) - categoryOrder(b.title) || a.title.localeCompare(b.title, 'he'));
}

export function normalizeCatalog(rawCatalog) {
  const rawProducts = Array.isArray(rawCatalog?.products) ? rawCatalog.products : [];
  const mappedProducts = rawProducts
    .map(mapProduct)
    .filter((product) => product.title && product.mainImage !== PLACEHOLDER_IMAGE);
  const products = groupCatalogProducts(mappedProducts);
  const chapters = buildCategoryChapters(products);

  return {
    baseUrl: rawCatalog?.base_url || '',
    products,
    chapters,
    categories: buildCatalogCategories(products),
    featured: products
      .filter((product) => product.images.length > 0)
      .slice(0, 8),
  };
}

export function searchCatalog(chapters, query, filters = {}) {
  const value = query.trim().toLowerCase();
  const categoryId = filters.categoryId || 'all';
  const sortBy = filters.sortBy || 'recommended';
  const onlyGrouped = Boolean(filters.onlyGrouped);

  return chapters
    .map((chapter) => ({
      ...chapter,
      products: sortProducts(chapter.products.filter((product) => {
        const matchesQuery = !value || product.searchText.includes(value) || chapter.title.toLowerCase().includes(value);
        const matchesCategory = categoryId === 'all' || product.primaryCategory?.id === categoryId;
        const matchesGrouped = !onlyGrouped || Number(product.groupedCount || 1) > 1;
        return matchesQuery && matchesCategory && matchesGrouped;
      }), sortBy),
    }))
    .filter((chapter) => chapter.products.length > 0);
}

export function sortProducts(products, sortBy = 'recommended') {
  const sorted = [...products];
  if (sortBy === 'price-asc') {
    sorted.sort((a, b) => (a.priceAmount ?? Number.MAX_SAFE_INTEGER) - (b.priceAmount ?? Number.MAX_SAFE_INTEGER));
  } else if (sortBy === 'price-desc') {
    sorted.sort((a, b) => (b.priceAmount ?? -1) - (a.priceAmount ?? -1));
  } else if (sortBy === 'designs') {
    sorted.sort((a, b) => (b.groupedCount || 1) - (a.groupedCount || 1) || String(a.title).localeCompare(String(b.title), 'he'));
  } else if (sortBy === 'name') {
    sorted.sort((a, b) => String(a.title).localeCompare(String(b.title), 'he'));
  } else {
    sorted.sort((a, b) => {
      const scoreA = (a.groupedCount || 1) * 10 + (a.images?.length || 0);
      const scoreB = (b.groupedCount || 1) * 10 + (b.images?.length || 0);
      return scoreB - scoreA || String(a.title).localeCompare(String(b.title), 'he');
    });
  }
  return sorted;
}

export function unique(values) {
  return Array.from(new Set(values));
}

function getPriceAmount(product) {
  const amount = product?.current_price?.amount ?? product?.base_price ?? product?.price;
  const numeric = Number(amount);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

function buildHaystack(product, categoryPath = []) {
  return [
    product?.name,
    product?.slug,
    product?.short_description,
    product?.full_description,
    ...(Array.isArray(product?.tags) ? product.tags : []),
    ...categoryPath,
  ].filter(Boolean).join(' ').toLowerCase();
}

function ruleMatches(rule, haystack) {
  return rule.keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
}

function getPrimaryCategory(product, categoryPath = []) {
  const haystack = buildHaystack(product, categoryPath);
  const rule = CATEGORY_RULES.find((item) => ruleMatches(item, haystack));
  return rule ? { id: rule.id, label: rule.label } : { id: 'other', label: GENERIC_CATEGORY };
}

function getProductFamily(product, categoryPath = []) {
  const haystack = buildHaystack(product, categoryPath);
  const rule = FAMILY_RULES.find((item) => ruleMatches(item, haystack));

  if (rule) return { key: rule.key, title: rule.title };
  const category = getPrimaryCategory(product, categoryPath);
  return { key: `single-${slugify(product?.name || category.label)}`, title: product?.name || category.label };
}

function getDesignLabel(product, familyTitle) {
  const raw = String(product?.title || product?.name || '').trim();
  const withoutFamily = raw
    .replace(familyTitle, '')
    .replace(/^תיק גן\s*(?:דפוס|בעיצוב)?\s*/i, '')
    .replace(/^בקבוק\s*(?:ספורט|תרמי|נירוסטה)?\s*/i, '')
    .replace(/^קופסת אוכל\s*/i, '')
    .replace(/^סט\s*/i, '')
    .replace(/^[+\-\s]+/, '')
    .trim();

  return withoutFamily || raw || 'עיצוב נוסף';
}

function groupCatalogProducts(products) {
  const buckets = new Map();

  products.forEach((product) => {
    const key = `${product.primaryCategory.id}:${product.familyKey}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(product);
  });

  return Array.from(buckets.values()).flatMap((items) => {
    if (items.length < 2 || items[0].familyKey.startsWith('single-')) return items;

    const sorted = [...items].sort((a, b) => (b.images.length - a.images.length) || String(a.title).localeCompare(String(b.title), 'he'));
    const primary = sorted[0];
    const images = unique(sorted.flatMap((product) => product.images)).slice(0, 24);
    const prices = sorted.map((product) => product.priceAmount).filter((value) => Number.isFinite(value));
    const minPrice = prices.length ? Math.min(...prices) : null;
    const maxPrice = prices.length ? Math.max(...prices) : null;
    const designCount = sorted.length;
    const priceLabel = minPrice
      ? minPrice === maxPrice
        ? `₪${minPrice.toLocaleString('he-IL')}`
        : `החל מ-₪${minPrice.toLocaleString('he-IL')}`
      : primary.priceLabel;

    return [{
      ...primary,
      id: `family-${primary.primaryCategory.id}-${primary.familyKey}`,
      slug: slugify(`${primary.primaryCategory.label}-${primary.familyTitle}`),
      title: primary.familyTitle,
      name: primary.familyTitle,
      description: `${designCount.toLocaleString('he-IL')} עיצובים ודגמים תחת אותה משפחת מוצרים.`,
      longDescription: `בחרו מתוך ${designCount.toLocaleString('he-IL')} עיצובים ודגמים. פתיחת המוצר מציגה תמונות, וריאציות ופרטים להזמנה בוואטסאפ.`,
      images,
      mainImage: images[0] || primary.mainImage,
      priceAmount: minPrice,
      priceLabel,
      groupedCount: designCount,
      categoryName: primary.primaryCategory.label,
      tags: unique([
        primary.primaryCategory.label,
        `${designCount.toLocaleString('he-IL')} עיצובים`,
        ...sorted.flatMap((product) => product.tags || []),
      ]).slice(0, 7),
      designs: sorted.map((product) => ({
        id: product.id,
        label: getDesignLabel(product, primary.familyTitle),
        name: product.title,
        priceLabel: product.priceLabel,
        images: product.images,
        mainImage: product.mainImage,
      })),
      searchText: unique([
        primary.familyTitle,
        primary.primaryCategory.label,
        ...sorted.flatMap((product) => [product.title, product.description, product.longDescription, product.searchText]),
      ].filter(Boolean)).join(' ').toLowerCase(),
    }];
  });
}

function buildCatalogCategories(products) {
  const counts = new Map();
  products.forEach((product) => {
    const category = product.primaryCategory || { id: 'other', label: GENERIC_CATEGORY };
    const current = counts.get(category.id) || { ...category, count: 0 };
    current.count += 1;
    counts.set(category.id, current);
  });

  return Array.from(counts.values())
    .sort((a, b) => categoryOrder(a.label) - categoryOrder(b.label) || a.label.localeCompare(b.label, 'he'));
}

function categoryOrder(title) {
  const ruleIndex = CATEGORY_RULES.findIndex((rule) => rule.label === title || rule.id === title);
  return ruleIndex === -1 ? 99 : ruleIndex;
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

  if (title.includes('סטים')) return `${count} משפחות מוצרים שמרכזות סטים ותיאומים לגן`;
  if (title.includes('תיקים')) return `${count} משפחות תיקים ודגמים מסודרים לבחירה מהירה`;
  if (title.includes('בקבוקים')) return `${count} בקבוקים ודגמי שתייה לפי עיצוב וסגנון`;
  if (title.includes('חגים')) return `${count} רעיונות עונתיים וחגיגיים`;
  if (title.includes('צוות')) return `${count} מתנות שמתאימות לצוותי חינוך והוקרה`;

  return `${count} רעיונות מסודרים בקטגוריה הזו`;
}
