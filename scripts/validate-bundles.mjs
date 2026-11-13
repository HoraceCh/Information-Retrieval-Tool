import fs from "node:fs";
import path from "node:path";

const directory = path.resolve("dist/assets");
const MAX_JS_BYTES = 500 * 1024;
const files = fs.readdirSync(directory)
  .filter(file => file.endsWith(".js"))
  .map(file => ({ name: file, bytes: fs.statSync(path.join(directory, file)).size }))
  .sort((a, b) => b.bytes - a.bytes);

if (!files.length) {
  console.error("Bundle validation failed: no JavaScript files found.");
  process.exit(1);
}

console.log("JS bundle sizes (generated production files):");
for (const file of files) {
  console.log(`${(file.bytes / 1024).toFixed(1)} KiB  ${file.name}`);
}
const violations = files.filter(file => file.bytes > MAX_JS_BYTES);
if (violations.length) {
  console.error(`${violations.length} JavaScript chunk(s) exceed 500 KiB.`);
  process.exit(1);
}
console.log(`PASS: all ${files.length} JavaScript chunks are <= 500 KiB.`);
