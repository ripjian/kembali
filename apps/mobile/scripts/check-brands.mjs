import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/* Build gate: every brand config must be complete before a shell can be
 * built from it. Fails loudly instead of producing a half-branded app. */

const REQUIRED = ["appId", "appName", "tenant", "devUrl", "prodUrl"];
const dir = join(process.cwd(), "brands");
const files = readdirSync(dir).filter((f) => f.endsWith(".json"));

if (files.length === 0) {
  console.error("check-brands: no brand configs found in brands/");
  process.exit(1);
}

let failed = false;
for (const file of files) {
  const brand = JSON.parse(readFileSync(join(dir, file), "utf8"));
  const missing = REQUIRED.filter((k) => !brand[k] || typeof brand[k] !== "string");
  if (missing.length) {
    console.error(`check-brands: ${file} is missing ${missing.join(", ")}`);
    failed = true;
  }
  if (brand.appId && !/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/.test(brand.appId)) {
    console.error(`check-brands: ${file} appId "${brand.appId}" is not a valid bundle id`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log(`check-brands: ${files.length} brand config(s) valid`);
