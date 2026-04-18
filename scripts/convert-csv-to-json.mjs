import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve('c:/Users/chaim/Downloads/masebala-kids-craft');
const outputDir = path.join(rootDir, 'src', 'data');

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

    if (char === '\r') continue;

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

  const [headers, ...dataRows] = rows;
  return dataRows
    .filter(currentRow => currentRow.some(cell => cell !== ''))
    .map(currentRow => Object.fromEntries(headers.map((header, index) => [header, currentRow[index] ?? ''])));
}

function parseMaybeJson(value) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return value;
    }
  }
  return value;
}

function coerceValue(key, value) {
  const parsed = parseMaybeJson(value);
  if (parsed !== value) return parsed;

  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === '') return key === 'parent_id' ? '' : value;

  if (['display_order', 'base_price'].includes(key)) {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : value;
  }

  return value;
}

function convertCsvFile(inputName, outputName) {
  const inputPath = path.join(rootDir, inputName);
  const outputPath = path.join(outputDir, outputName);

  const rows = parseCsv(readUtf8(inputPath)).map(row => {
    const converted = {};
    for (const [key, value] of Object.entries(row)) {
      converted[key] = coerceValue(key, value);
    }
    return converted;
  });

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(rows, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${rows.length} rows to ${path.relative(rootDir, outputPath)}`);
}

convertCsvFile('Product_export.csv', 'products.json');
convertCsvFile('Category_export.csv', 'categories.json');
