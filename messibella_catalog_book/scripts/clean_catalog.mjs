import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { cleanCatalog } from "../src/lib/catalogUtils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cwd = path.resolve(__dirname, "..");
const inputPath = path.join(cwd, "public", "data", "catalog.json");
const outPath = path.join(cwd, "public", "data", "catalog.clean.json");

const args = process.argv.slice(2);
const inPlace = args.includes("--apply") || args.includes("--replace") || args.includes("--inplace");

if (!fs.existsSync(inputPath)) {
  console.error("catalog.json not found at:", inputPath);
  process.exit(2);
}

const raw = fs.readFileSync(inputPath, "utf8");
let data;
try {
  data = JSON.parse(raw);
} catch (err) {
  console.error("Failed to parse catalog.json:", err.message);
  process.exit(3);
}

const out = cleanCatalog(data);

if (inPlace) {
  // create backup
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(cwd, "public", "data", `catalog.json.bak.${ts}`);
  fs.copyFileSync(inputPath, backupPath);
  fs.writeFileSync(inputPath, JSON.stringify(out, null, 2), "utf8");
  console.log("Backed up original catalog to:", backupPath);
  console.log("Replaced original catalog.json with cleaned data at:", inputPath);
  // also write canonical clean file
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), "utf8");
  console.log("Also wrote cleaned catalog to:", outPath);
} else {
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), "utf8");
  console.log("Wrote cleaned catalog to:", outPath);
  console.log("Run with --apply to replace public/data/catalog.json (backup created).");
}

