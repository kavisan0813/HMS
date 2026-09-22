import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const ASSETS_DIR = path.resolve("dist/assets");
const MAX_RAW_KB = 700; // PRD target: < 700 KB minified
const MAX_GZIP_KB = 250; // PRD target: < 250 KB gzip

if (!fs.existsSync(ASSETS_DIR)) {
  console.error(
    "❌ Error: dist/assets directory not found. Please run 'npm run build' first.",
  );
  process.exit(1);
}

const files = fs.readdirSync(ASSETS_DIR);
const indexFile = files.find(
  (file) => file.startsWith("index-") && file.endsWith(".js"),
);

if (!indexFile) {
  console.error(
    "❌ Error: Could not find main bundle (index-*.js) in dist/assets.",
  );
  process.exit(1);
}

const filePath = path.join(ASSETS_DIR, indexFile);
const content = fs.readFileSync(filePath);
const rawBytes = content.length;
const gzipBytes = zlib.gzipSync(content).length;

const rawKb = rawBytes / 1024;
const gzipKb = gzipBytes / 1024;

console.log("\n==========================================");
console.log("📦 Bundle Regression Guard (PRD Policy)");
console.log("==========================================");
console.log(`Main Bundle File : ${indexFile}`);
console.log(
  `Raw Minified Size: ${rawKb.toFixed(2)} KB (Limit: ${MAX_RAW_KB} KB)`,
);
console.log(
  `Gzip Size        : ${gzipKb.toFixed(2)} KB (Limit: ${MAX_GZIP_KB} KB)`,
);
console.log("==========================================");

let failed = false;

if (rawKb > MAX_RAW_KB) {
  console.error(
    `❌ REGRESSION: Main bundle exceeds raw limit of ${MAX_RAW_KB} KB!`,
  );
  failed = true;
}

if (gzipKb > MAX_GZIP_KB) {
  console.error(
    `❌ REGRESSION: Main bundle exceeds gzip limit of ${MAX_GZIP_KB} KB!`,
  );
  failed = true;
}

if (failed) {
  console.error("\n❌ Bundle regression check failed.\n");
  process.exit(1);
} else {
  console.log("✅ Main bundle size check passed within approved budget!\n");
  process.exit(0);
}
