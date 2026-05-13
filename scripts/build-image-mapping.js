#!/usr/bin/env node
// Generates src/data/images_mapping.json from the migrator CSV.
// Run with: node scripts/build-image-mapping.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CSV_PATH = path.resolve(__dirname, '../messibella_migrator/output_gui/data/images_mapping.csv');
const OUT_PATH = path.resolve(__dirname, '../src/data/images_mapping.json');

const csv = fs.readFileSync(CSV_PATH, 'utf8');
const lines = csv.split('\n').slice(1); // skip header

const mapping = {};

for (const line of lines) {
  if (!line.trim()) continue;
  const cols = line.split(',');

  // Find the column that holds the remote URL (starts with https://)
  const urlIdx = cols.findIndex((c) => c.startsWith('https://'));
  if (urlIdx === -1) continue;

  const imageUrl = cols[urlIdx].trim();
  const localFilename = (cols[urlIdx + 1] || '').trim();

  if (localFilename && localFilename.startsWith('images')) {
    // Normalise Windows backslashes to forward slashes
    mapping[imageUrl] = localFilename.replace(/\\/g, '/');
  }
}

fs.writeFileSync(OUT_PATH, JSON.stringify(mapping));
console.log(`Written ${Object.keys(mapping).length} entries to ${OUT_PATH}`);
