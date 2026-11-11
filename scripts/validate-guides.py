import json
import re
import sys
from pathlib import Path

BASE = "https://horacech.github.io/Information-Retrieval-Tool"
GUIDES = {
    "academic-literature-search": ["meaning", "workflow", "example", "database", "pitfalls", "assistant", "english"],
    "boolean-search": ["operators", "parentheses", "syntax", "build", "mistakes", "assistant", "english"],
    "keyword-expansion": ["why", "types", "bilingual", "example", "quality", "assistant", "english"],
}
errors = []
for slug, required_ids in GUIDES.items():
    path = Path("public/guides") / slug / "index.html"
    html = path.read_text(encoding="utf-8")
    ids = set(re.findall(r'\\bid="([^"]+)"', html))
    fragments = re.findall(r'href="#([^"]+)"', html)
    broken = sorted(set(fragments) - ids)
    canonical = f"{BASE}/guides/{slug}/"
    match = re.search(r'<script type="application/ld\\+json">(.*?)</script>', html, re.S)
    try:
        data = json.loads(match.group(1)) if match else {}
    except (ValueError, AttributeError):
        data = {}
    if not re.search(r'<title>[^<]+</title>', html):
        errors.append(f"{slug}: missing title")
    if not re.search(r'<meta name="description" content="[^"]+"', html):
        errors.append(f"{slug}: missing description")
    if f'<link rel="canonical" href="{canonical}">' not in html:
        errors.append(f"{slug}: incorrect canonical")
    if broken:
        errors.append(f"{slug}: broken anchors: {', '.join(broken)}")
    missing = sorted(set(required_ids) - ids)
    if missing:
        errors.append(f"{slug}: missing sections: {', '.join(missing)}")
    if data.get("@type") != "TechArticle" or data.get("mainEntityOfPage") != canonical:
        errors.append(f"{slug}: invalid TechArticle JSON-LD")

sitemap = Path("public/sitemap.xml").read_text(encoding="utf-8")
for slug in GUIDES:
    if f"{BASE}/guides/{slug}/" not in sitemap:
        errors.append(f"sitemap missing {slug}")
if not Path("public/robots.txt").exists():
    errors.append("robots.txt missing")
if errors:
    print("\\n".join(errors), file=sys.stderr)
    sys.exit(1)
print(f"Validated {len(GUIDES)} guides, anchors, metadata, JSON-LD and sitemap.")
