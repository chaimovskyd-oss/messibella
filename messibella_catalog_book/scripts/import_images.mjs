import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

// Source migrator images (sibling folder)
const migratorImages = path.resolve(repoRoot, '..', 'messibella_migrator', 'output_gui', 'images');
const srcCatalogJson = path.join(repoRoot, 'public', 'data', 'catalog.json');
const destImages = path.join(repoRoot, 'public', 'images');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

if (!fs.existsSync(migratorImages)) {
  console.error('Source images folder not found:', migratorImages);
  process.exit(2);
}

ensureDir(destImages);

// Copy images (skip existing)
const files = fs.readdirSync(migratorImages);
let copied = 0;
for (const f of files) {
  const s = path.join(migratorImages, f);
  const d = path.join(destImages, f);
  try {
    if (!fs.existsSync(d)) {
      fs.copyFileSync(s, d);
      copied++;
    }
  } catch (err) {
    console.error('Failed to copy', f, err.message);
  }
}

console.log(`Copied ${copied} files to ${destImages}`);

if (!fs.existsSync(srcCatalogJson)) {
  console.error('Catalog json not found at', srcCatalogJson);
  process.exit(3);
}

const backup = srcCatalogJson + '.bak.' + new Date().toISOString().replace(/[:.]/g,'-');
fs.copyFileSync(srcCatalogJson, backup);
console.log('Backed up catalog.json to', backup);

const raw = fs.readFileSync(srcCatalogJson, 'utf8');
let catalog;
try { catalog = JSON.parse(raw); } catch (err) { console.error('Invalid JSON', err.message); process.exit(4); }

const imageSet = new Set(files.map(f => f.toLowerCase()));

function mapImageEntry(img) {
  if (!img) return img;
  // if already local_filename and points to images/, keep
  if (img.local_filename && String(img.local_filename).toLowerCase().includes('images/')) return img;

  // try to derive filename from local_filename or image_url
  const candidates = [];
  if (img.local_filename) candidates.push(path.basename(String(img.local_filename)));
  if (img.localFilename) candidates.push(path.basename(String(img.localFilename)));
  if (img.image_url) candidates.push(path.basename(String(img.image_url)));

  for (const c of candidates) {
    if (!c) continue;
    const lc = c.toLowerCase();
    if (imageSet.has(lc)) {
      img.local_filename = `images/${c}`;
      return img;
    }
    // try removing query params
    const clean = c.split('?')[0];
    if (imageSet.has(clean.toLowerCase())) {
      img.local_filename = `images/${clean}`;
      return img;
    }
  }

  return img;
}

for (const p of catalog.products || []) {
  if (Array.isArray(p.images)) p.images = p.images.map(mapImageEntry);
  if (Array.isArray(p.designs)) {
    p.designs = p.designs.map(d => {
      if (Array.isArray(d.images)) d.images = d.images.map(mapImageEntry);
      return d;
    });
  }
}

const outPath = path.join(path.dirname(srcCatalogJson), 'catalog.images-mapped.json');
fs.writeFileSync(outPath, JSON.stringify(catalog, null, 2), 'utf8');
// also overwrite original (since user asked to integrate)
fs.writeFileSync(srcCatalogJson, JSON.stringify(catalog, null, 2), 'utf8');

console.log('Updated catalog.json with local image paths and wrote', outPath);
