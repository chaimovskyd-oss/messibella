/**
 * Generates static entity JSON files into messibella_migrator/output_gui/data/
 * so they are available as /data/<EntityName>.json in the Vite build output.
 *
 * Run with: node scripts/generate-static-content.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC_DATA = path.join(ROOT, 'src', 'data');
const OUT_DIR = path.join(ROOT, 'messibella_migrator', 'output_gui', 'data');

function read(file) {
  return JSON.parse(fs.readFileSync(path.join(SRC_DATA, file), 'utf8'));
}

function write(entityName, data) {
  const dest = path.join(OUT_DIR, `${entityName}.json`);
  fs.writeFileSync(dest, JSON.stringify(data, null, 2));
  console.log(`  Wrote ${entityName}.json (${data.length ?? '?'} items)`);
}

// ── Static defaults for small entities ──────────────────────────────────────

const banners = [
  {
    id: 'banner-hero-local',
    title: 'מוצרים ממותגים לילדים ולגנים',
    subtitle: 'קטלוג מקומי עם התאמה אישית, תיקים, בקבוקים ומתנות',
    image_url: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=1200',
    button_text: 'לצפייה במוצרים',
    button_link: 'Catalog',
    type: 'hero',
    is_active: true,
    display_order: 1,
  },
];

const navMenuItems = [
  { id: 'nav-home',         label: 'דף הבית',               page: 'Home',         display_order: 1, is_active: true },
  { id: 'nav-catalog',      label: 'מוצרים',                 page: 'Catalog',      display_order: 2, is_active: true },
  { id: 'nav-tips',         label: 'הטיפים שלנו',            page: 'Tips',         display_order: 3, is_active: true },
  { id: 'nav-gallery',      label: 'גלריה',                  page: 'Gallery',      display_order: 4, is_active: true },
  { id: 'nav-testimonials', label: 'מה לקוחות אומרים עלינו', page: 'Testimonials', display_order: 5, is_active: true },
  { id: 'nav-contact',      label: 'צור קשר',                page: 'Home',         display_order: 6, is_active: true },
];

const shippingOptions = [
  { id: 'shipping-delivery',     name: 'משלוח עד הבית', type: 'delivery',      price: 30, free_above: 200, estimated_days: '3-5 ימי עסקים',  is_active: true },
  { id: 'shipping-pickup-point', name: 'נקודת איסוף',   type: 'pickup_point',  price: 15, free_above: null, estimated_days: '2-4 ימי עסקים', is_active: true },
  { id: 'shipping-self-pickup',  name: 'איסוף עצמי',    type: 'self_pickup',   price: 0,  free_above: null, estimated_days: '1-2 ימי עסקים', is_active: true },
];

// ── Main ─────────────────────────────────────────────────────────────────────

console.log('Generating static entity JSON files...');

const products   = read('products.json');
const categories = read('categories.json');

write('Product',        products);
write('Category',       categories);
write('Banner',         banners);
write('NavMenuItem',    navMenuItems);
write('ShippingOption', shippingOptions);
write('Review',         []);
write('GalleryItem',    []);
write('BlogPost',       []);
write('Coupon',         []);

console.log('Done.');
