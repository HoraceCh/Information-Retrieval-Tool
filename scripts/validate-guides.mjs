import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const baseUrl = "https://horacech.github.io/Information-Retrieval-Tool";
const guides = [
  {
    slug: "academic-literature-search",
    requiredIds: ["meaning", "workflow", "example", "database", "pitfalls", "assistant", "english"],
  },
  {
    slug: "boolean-search",
    requiredIds: ["operators", "parentheses", "syntax", "build", "mistakes", "assistant", "english"],
  },
  {
    slug: "keyword-expansion",
    requiredIds: ["why", "types", "bilingual", "example", "quality", "assistant", "english"],
  },
];

const errors = [];
for (const guide of guides) {
  const relativePath = path.join("public", "guides", guide.slug, "index.html");
  const html = fs.readFileSync(path.join(root, relativePath), "utf8");
  const ids = new Set([...html.matchAll(/\\bid="([^"]+)"/g)].map((match) => match[1]));
  const fragments = [...html.matchAll(/href="#([^"]+)"/g)].map((match) => match[1]);
  const missingFragments = fragments.filter((fragment) => !ids.has(fragment));
  const missingRequiredIds = guide.requiredIds.filter((id) => !ids.has(id));
  const canonical = `${baseUrl}/guides/${guide.slug}/`;
  const jsonLdMatch = html.match(/<script type="application\\/ld\\+json">([\\s\\S]*?)<\\/script>/);
  let jsonLd = null;
  try {
    jsonLd = jsonLdMatch ? JSON.parse(jsonLdMatch[1]) : null;
  } catch {
    errors.push(`${guide.slug}: invalid JSON-LD`);
  }

  if (!/<title>[^<]+<\\/title>/.test(html)) errors.push(`${guide.slug}: missing title`);
  if (!/<meta name="description" content="[^"]+"/.test(html)) errors.push(`${guide.slug}: missing meta description`);
  if (!html.includes(`<link rel="canonical" href="${canonical}">`)) errors.push(`${guide.slug}: incorrect canonical URL`);
  if (missingFragments.length) errors.push(`${guide.slug}: broken in-page links: ${missingFragments.join(", ")}`);
  if (missingRequiredIds.length) errors.push(`${guide.slug}: missing required sections: ${missingRequiredIds.join(", ")}`);
  if (!jsonLd || jsonLd["@type"] !== "TechArticle") errors.push(`${guide.slug}: missing TechArticle JSON-LD`);
  if (jsonLd && jsonLd.mainEntityOfPage !== canonical) errors.push(`${guide.slug}: JSON-LD URL does not match canonical`);
}

const sitemap = fs.readFileSync(path.join(root, "public", "sitemap.xml"), "utf8");
for (const guide of guides) {
  const url = `${baseUrl}/guides/${guide.slug}/`;
  if (!sitemap.includes(url)) errors.push(`sitemap.xml: missing ${url}`);
}
if (!fs.existsSync(path.join(root, "public", "robots.txt"))) errors.push("robots.txt is missing");

if (errors.length) {
  console.error("Static guide validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Validated ${guides.length} static guides, their section links, metadata, JSON-LD and sitemap entries.`);
