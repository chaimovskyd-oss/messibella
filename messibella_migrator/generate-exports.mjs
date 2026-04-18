import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const rootDir = path.resolve('c:/Users/chaim/Downloads/masebala-kids-craft');
const outputGuiDir = path.join(rootDir, 'messibella_migrator', 'output_gui');
const dataDir = path.join(outputGuiDir, 'data');

const productExportPath = path.join(rootDir, 'Product_export.csv');
const categoryExportPath = path.join(rootDir, 'Category_export.csv');

function readUtf8(filePath) {
  return fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ',') {
      row.push(field);
      field = '';
      continue;
    }

    if (char === '\r') {
      continue;
    }

    if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  if (rows.length === 0) return [];

  const headers = rows[0];
  return rows.slice(1).filter(r => r.some(cell => cell !== '')).map((cells) => {
    const entry = {};
    headers.forEach((header, index) => {
      entry[header] = cells[index] ?? '';
    });
    return entry;
  });
}

function toCsv(rows, headers) {
  const escapeCell = (value) => {
    const stringValue = value == null ? '' : String(value);
    return `"${stringValue.replace(/"/g, '""')}"`;
  };

  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map(header => escapeCell(row[header] ?? '')).join(','));
  }
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

function parseJsonFile(filePath) {
  return JSON.parse(readUtf8(filePath));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function hash24(value) {
  return crypto.createHash('md5').update(value).digest('hex').slice(0, 24);
}

function parseNumber(value) {
  const num = Number.parseFloat(value);
  return Number.isFinite(num) ? num : null;
}

function cleanDescription(value) {
  if (!value) return '';
  let text = String(value).replace(/\s+/g, ' ').trim();

  const descriptionMarker = text.indexOf('תיאור ביקורות');
  if (descriptionMarker !== -1) {
    text = text.slice(descriptionMarker);
    text = text.replace(/^תיאור ביקורות\s*\(\d+\)\s*/u, '');
  }

  const reviewMarker = text.indexOf('כתיבת ביקורת');
  if (reviewMarker !== -1) {
    text = text.slice(0, reviewMarker);
  }

  text = text
    .replace(/^.*?זמינות:\s*[^ ]+\s*/u, '')
    .replace(/אפשרויות זמינות.*$/u, '')
    .replace(/\s+/g, ' ')
    .trim();

  return text;
}

function buildShortDescription(value) {
  if (!value) return '';
  const trimmed = value.trim();
  if (trimmed.length <= 160) return trimmed;
  const sentence = trimmed.split(/(?<=[.!?])\s+/u)[0]?.trim();
  if (sentence && sentence.length <= 160) return sentence;
  return `${trimmed.slice(0, 157).trim()}...`;
}

function matchesWord(text, word) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^\\u0590-\\u05FF])${escaped}([^\\u0590-\\u05FF]|$)`, 'u').test(text);
}

function containsAnyWord(text, words) {
  return words.some(word => matchesWord(text, word));
}

function normalizeChoiceLabel(label) {
  return String(label || '').replace(/\s+/g, ' ').trim();
}

function buildDiscounts(entries, basePrice) {
  if (!basePrice) return [];

  const discounts = [];
  for (const entry of entries) {
    for (const tier of entry.tier_prices || []) {
      const minQty = Number(tier.min_quantity);
      const maxQty = tier.max_quantity == null ? null : Number(tier.max_quantity);
      const amount = Number(tier.amount);

      if (!Number.isFinite(minQty) || minQty < 2 || minQty > 500) continue;
      if (!Number.isFinite(amount) || amount <= 0 || amount > basePrice) continue;

      const discountPercent = Math.round((1 - (amount / basePrice)) * 100);
      if (discountPercent <= 0 || discountPercent > 50) continue;

      discounts.push({
        min_qty: minQty,
        max_qty: Number.isFinite(maxQty) ? maxQty : null,
        discount_percent: discountPercent,
      });
    }
  }

  const merged = new Map();
  for (const discount of discounts) {
    const key = `${discount.min_qty}|${discount.max_qty ?? ''}`;
    const existing = merged.get(key);
    if (!existing || existing.discount_percent < discount.discount_percent) {
      merged.set(key, discount);
    }
  }

  return [...merged.values()].sort((a, b) => a.min_qty - b.min_qty);
}

function inferExtraCustomizationOptions(text) {
  const options = [];
  const pushOption = (option) => {
    if (!options.some(existing => existing.label === option.label)) {
      options.push(option);
    }
  };

  if (text.includes('שם הילד')) {
    pushOption({ type: 'text', label: 'שם הילד', required: true, options: [] });
  }
  if (text.includes('שם הגן')) {
    pushOption({ type: 'text', label: 'שם הגן', required: false, options: [] });
  }
  if (text.includes('כיתוב לבחירה')) {
    pushOption({ type: 'text', label: 'כיתוב לבחירה', required: true, options: [] });
  }
  if (text.includes('הערות להזמנה')) {
    pushOption({ type: 'text', label: 'הערות להזמנה', required: false, options: [] });
  }
  if (text.includes('רשימת שמות')) {
    pushOption({ type: 'names_list', label: 'רשימת שמות', required: false, options: [] });
  }
  if (text.includes('העלאת קובץ') || text.includes('לשליחת תמונה')) {
    pushOption({ type: 'image', label: 'העלאת תמונה', required: false, options: [] });
  }

  return options;
}

function mapOptionGroupToCustomization(group) {
  const label = normalizeChoiceLabel(group.label);
  const choices = (group.choices || [])
    .map(choice => ({
      ...choice,
      label: normalizeChoiceLabel(choice.label),
    }))
    .filter(choice => choice.label);

  if (!label || label === 'דירוג' || choices.length === 0) {
    return null;
  }

  const optionLabels = unique(choices.map(choice => choice.label));
  const isColor = label.includes('צבע');

  return {
    type: isColor ? 'color' : 'select',
    label,
    required: true,
    options: optionLabels,
  };
}

function buildCustomizationOptions(groupEntries, cleanedText) {
  const mapped = [];

  for (const entry of groupEntries) {
    for (const group of entry.raw?.option_groups || []) {
      const option = mapOptionGroupToCustomization(group);
      if (!option) continue;
      if (!mapped.some(existing => existing.label === option.label)) {
        mapped.push(option);
      }
    }
  }

  for (const extra of inferExtraCustomizationOptions(cleanedText)) {
    if (!mapped.some(existing => existing.label === extra.label)) {
      mapped.push(extra);
    }
  }

  return mapped;
}

function isHolidayProduct(text) {
  return containsAnyWord(text, ['חנוכה', 'פסח', 'פורים', 'אפיקומן', 'יום העצמאות', 'יום המשפחה']);
}

function inferRootCategoryName(product) {
  const text = `${product.name} ${product.category_path_text}`.replace(/\s+/g, ' ');

  if (text.includes('מדבק')) return 'מדבקות שם';
  if (isHolidayProduct(text)) return 'מתנות לחגים';
  if (/(^|[^א-ת])(חולצה|בגד גוף|סינר אוכל)([^א-ת]|$)/u.test(text)) return 'חולצות עם שם';
  if (/(^|[^א-ת])(תיק|קלמר)([^א-ת]|$)/u.test(text)) return 'תיקים לגן';
  if (/(^|[^א-ת])(בקבוק|ספל|כוס)([^א-ת]|$)/u.test(text)) return 'בקבוקים ממותגים';
  return 'מתנות סוף שנה';
}

function inferSubcategoryName(product, rootCategoryName) {
  const text = `${product.name} ${product.category_path_text}`.replace(/\s+/g, ' ');

  if (rootCategoryName === 'מדבקות שם') {
    return 'מדבקות';
  }

  if (rootCategoryName === 'בקבוקים ממותגים') {
    if (containsAnyWord(text, ['קופסת אוכל'])) return 'קופסאות אוכל';
    if (containsAnyWord(text, ['ספל', 'כוס', 'תחתיות'])) return 'ספלים וכוסות';
    return 'בקבוקים';
  }

  if (rootCategoryName === 'תיקים לגן') {
    if (containsAnyWord(text, ['קלמר'])) return 'קלמרים';
    if (containsAnyWord(text, ['תיק שרוך'])) return 'תיקי שרוך';
    if (containsAnyWord(text, ['תיק ספר'])) return 'תיקי ספר';
    if (containsAnyWord(text, ['תיק ים', 'תיק יוטה', 'תיק כותנה', 'תיקניק'])) return 'תיקים ואביזרים';
    if (containsAnyWord(text, ['בקבוק', 'קופסת אוכל', 'סט'])) return 'סטים לגן';
    return 'תיקי גן';
  }

  if (rootCategoryName === 'חולצות עם שם') {
    if (containsAnyWord(text, ['בגד גוף'])) return 'בגדי גוף';
    if (containsAnyWord(text, ['סינר'])) return 'סינרים';
    return 'חולצות';
  }

  if (rootCategoryName === 'מתנות לחגים') {
    if (containsAnyWord(text, ['יום המשפחה'])) return 'יום המשפחה';
    if (containsAnyWord(text, ['פסח', 'אפיקומן', 'הגדה'])) return 'פסח';
    if (containsAnyWord(text, ['פורים', 'משלוח מנות'])) return 'פורים';
    if (containsAnyWord(text, ['חנוכה', 'חנוכיה', 'סביבון'])) return 'חנוכה';
    if (containsAnyWord(text, ['יום העצמאות'])) return 'יום העצמאות';
    return 'חגים ומועדים';
  }

  if (rootCategoryName === 'מתנות סוף שנה') {
    if (containsAnyWord(text, ['מגבת'])) return 'מגבות';
    if (containsAnyWord(text, ['עציץ', 'שתילה'])) return 'עציצים ושתילה';
    if (containsAnyWord(text, ['משחק', 'פאזל', 'יצירה', 'ערכת'])) return 'יצירה ומשחק';
    if (containsAnyWord(text, ['שעון'])) return 'שעונים';
    if (containsAnyWord(text, ['מסגרת', 'בלוק', 'שלט', 'פד לעכבר', 'מחזיק', 'רשימת קניות', 'עץ ריח'])) return 'מתנות אישיות';
    return 'מתנות כלליות';
  }

  return '';
}

const categoryRows = parseCsv(readUtf8(categoryExportPath));
const rootCategoryRows = categoryRows.filter(row => !row.parent_id);
const productTemplateRows = parseCsv(readUtf8(productExportPath));
const productTemplate = productTemplateRows[0] || {};

const sourceProducts = parseCsv(readUtf8(path.join(dataDir, 'products_import.csv')));
const imageMappings = parseCsv(readUtf8(path.join(dataDir, 'images_mapping.csv')));
const catalog = parseJsonFile(path.join(dataDir, 'catalog.json'));

const categoryRowsByName = new Map(rootCategoryRows.map(row => [row.name, row]));
const imageMappingsByProductId = new Map();
for (const image of imageMappings) {
  const group = imageMappingsByProductId.get(image.product_id) || [];
  group.push(image);
  imageMappingsByProductId.set(image.product_id, group);
}

const catalogByProductId = new Map();
for (const product of catalog.products) {
  const group = catalogByProductId.get(product.product_id) || [];
  group.push(product);
  catalogByProductId.set(product.product_id, group);
}

const groupedBySlug = new Map();
for (const row of sourceProducts) {
  const key = row.slug || row.product_id;
  const group = groupedBySlug.get(key) || [];
  group.push(row);
  groupedBySlug.set(key, group);
}

const mergedProducts = [];

for (const [slug, rows] of groupedBySlug.entries()) {
  const sortedRows = [...rows].sort((a, b) => Number(a.product_id) - Number(b.product_id));
  const productIds = unique(sortedRows.map(row => row.product_id));
  const catalogEntries = productIds.flatMap(id => catalogByProductId.get(id) || []);
  const cleanedDescriptions = unique([
    ...sortedRows.map(row => cleanDescription(row.full_description)),
    ...catalogEntries.map(entry => cleanDescription(entry.full_description)),
  ]).filter(Boolean);

  const fullDescription = cleanedDescriptions.sort((a, b) => b.length - a.length)[0] || '';
  const shortDescription = sortedRows.map(row => row.short_description).find(Boolean) || buildShortDescription(fullDescription);
  const currentPrices = unique([
    ...sortedRows.map(row => parseNumber(row.price)),
    ...catalogEntries.map(entry => Number(entry.current_price?.amount)),
  ].filter(Number.isFinite));
  const oldPrices = unique([
    ...sortedRows.map(row => parseNumber(row.old_price)),
    ...catalogEntries.map(entry => Number(entry.previous_price?.amount)),
  ].filter(Number.isFinite));
  const basePrice = currentPrices.length > 0 ? Math.min(...currentPrices) : 0;

  const imageUrls = [];
  const pushImage = (value) => {
    if (value && !imageUrls.includes(value)) imageUrls.push(value);
  };

  sortedRows.forEach(row => pushImage(row.main_image_url));
  for (const productId of productIds) {
    for (const image of (imageMappingsByProductId.get(productId) || []).sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))) {
      pushImage(image.image_url);
    }
  }
  catalogEntries.forEach(entry => {
    (entry.images || []).forEach(image => pushImage(image.image_url));
    (entry.designs || []).forEach(design => (design.images || []).forEach(image => pushImage(image.image_url)));
  });

  const tierDiscounts = buildDiscounts(catalogEntries, basePrice);
  const categoryPathText = unique(sortedRows.map(row => row.category_path)).join(' | ');
  const name = sortedRows[0].name;

  const merged = {
    slug,
    source_product_ids: productIds,
    product_id: productIds[0],
    name,
    category_path_text: categoryPathText,
    short_description: shortDescription,
    full_description: fullDescription,
    base_price: basePrice,
    main_image: imageUrls[0] || '',
    gallery: imageUrls.slice(1, 19),
    quantity_discounts: tierDiscounts,
    customization_options: buildCustomizationOptions(catalogEntries, `${fullDescription} ${categoryPathText}`),
    tags: oldPrices.some(price => price > basePrice) ? ['sale'] : [],
    is_active: sortedRows.some(row => /במלאי|ימי עסקים/u.test(row.availability || '')),
  };

  merged.root_category_name = inferRootCategoryName(merged);
  merged.subcategory_name = inferSubcategoryName(merged, merged.root_category_name);
  mergedProducts.push(merged);
}

const rootOrderByName = new Map(rootCategoryRows.map(row => [row.name, Number(row.display_order || 0)]));
const nowIso = new Date().toISOString();
const creatorId = productTemplate.created_by_id || '';
const creatorEmail = productTemplate.created_by || '';

const subcategoryRegistry = new Map();
for (const product of mergedProducts) {
  const rootRow = categoryRowsByName.get(product.root_category_name);
  if (!rootRow || !product.subcategory_name) continue;

  const key = `${rootRow.id}::${product.subcategory_name}`;
  if (!subcategoryRegistry.has(key)) {
    subcategoryRegistry.set(key, {
      name: product.subcategory_name,
      parent_id: rootRow.id,
      display_order: subcategoryRegistry.size + 1,
      id: hash24(`category:${rootRow.id}:${product.subcategory_name}`),
      image_url: product.main_image || '',
      created_date: nowIso,
      updated_date: nowIso,
      created_by_id: creatorId,
      created_by: creatorEmail,
      is_active: 'true',
      is_sample: 'false',
    });
  }
}

for (const product of mergedProducts) {
  const rootRow = categoryRowsByName.get(product.root_category_name);
  const subKey = rootRow && product.subcategory_name ? `${rootRow.id}::${product.subcategory_name}` : null;
  product.category_id = subKey && subcategoryRegistry.has(subKey)
    ? subcategoryRegistry.get(subKey).id
    : rootRow.id;
  product.root_category_id = rootRow.id;
}

mergedProducts.sort((a, b) => {
  const rootCompare = (rootOrderByName.get(a.root_category_name) || 999) - (rootOrderByName.get(b.root_category_name) || 999);
  if (rootCompare !== 0) return rootCompare;
  const subCompare = String(a.subcategory_name || '').localeCompare(String(b.subcategory_name || ''), 'he');
  if (subCompare !== 0) return subCompare;
  const categoryCompare = String(a.category_id).localeCompare(String(b.category_id), 'he');
  if (categoryCompare !== 0) return categoryCompare;
  return Number(a.product_id) - Number(b.product_id);
});

const productHeaders = [
  'short_description',
  'is_active',
  'main_image',
  'display_order',
  'customization_options',
  'tags',
  'quantity_discounts',
  'video_url',
  'full_description',
  'category_id',
  'name',
  'base_price',
  'gallery',
  'id',
  'created_date',
  'updated_date',
  'created_by_id',
  'created_by',
  'is_sample',
];

const productExportRows = mergedProducts.map((product, index) => ({
  short_description: product.short_description,
  is_active: product.is_active ? 'true' : 'false',
  main_image: product.main_image,
  display_order: String(index + 1),
  customization_options: JSON.stringify(product.customization_options),
  tags: JSON.stringify(product.tags),
  quantity_discounts: JSON.stringify(product.quantity_discounts),
  video_url: '',
  full_description: product.full_description,
  category_id: product.category_id,
  name: product.name,
  base_price: String(product.base_price || 0),
  gallery: JSON.stringify(product.gallery),
  id: hash24(`product:${product.slug}`),
  created_date: nowIso,
  updated_date: nowIso,
  created_by_id: creatorId,
  created_by: creatorEmail,
  is_sample: 'false',
}));

const categoryProductMap = new Map();
for (const product of mergedProducts) {
  if (!categoryProductMap.has(product.category_id)) {
    categoryProductMap.set(product.category_id, product);
  }
  if (!categoryProductMap.has(product.root_category_id)) {
    categoryProductMap.set(product.root_category_id, product);
  }
}

const categoryHeaders = [
  'name',
  'parent_id',
  'display_order',
  'is_active',
  'image_url',
  'id',
  'created_date',
  'updated_date',
  'created_by_id',
  'created_by',
  'is_sample',
];

const rootCategoryExportRows = rootCategoryRows.map((row, index) => {
  const representative = categoryProductMap.get(row.id);
  return {
    name: row.name,
    parent_id: '',
    display_order: row.display_order || String(index + 1),
    is_active: row.is_active || 'true',
    image_url: representative?.main_image || row.image_url || '',
    id: row.id,
    created_date: row.created_date || nowIso,
    updated_date: nowIso,
    created_by_id: row.created_by_id || creatorId,
    created_by: row.created_by || creatorEmail,
    is_sample: 'false',
  };
});

const childCategoryGroups = new Map();
for (const row of subcategoryRegistry.values()) {
  const group = childCategoryGroups.get(row.parent_id) || [];
  group.push(row);
  childCategoryGroups.set(row.parent_id, group);
}

const childCategoryExportRows = [];
for (const rootRow of rootCategoryExportRows) {
  const children = (childCategoryGroups.get(rootRow.id) || [])
    .sort((a, b) => a.name.localeCompare(b.name, 'he'))
    .map((child, index) => ({
      ...child,
      display_order: String(index + 1),
      image_url: categoryProductMap.get(child.id)?.main_image || child.image_url || '',
    }));
  childCategoryExportRows.push(...children);
}

const categoryExportRows = [...rootCategoryExportRows, ...childCategoryExportRows];

fs.writeFileSync(productExportPath, toCsv(productExportRows, productHeaders), 'utf8');
fs.writeFileSync(categoryExportPath, toCsv(categoryExportRows, categoryHeaders), 'utf8');

console.log(`Generated ${productExportRows.length} products and ${categoryExportRows.length} categories.`);
