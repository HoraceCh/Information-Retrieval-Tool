import { spawnSync } from "node:child_process";

const result = spawnSync("npm", ["audit", "--json", "--audit-level=low"], {
  encoding: "utf8",
  maxBuffer: 16 * 1024 * 1024,
});

let report;
try {
  report = JSON.parse(result.stdout || "{}");
} catch {
  console.error("Could not parse npm audit JSON.");
  console.error(result.stderr || result.stdout?.slice(0, 1500));
  process.exit(1);
}

const totals = report.metadata?.vulnerabilities ?? {};
console.log("== npm audit baseline (informational, does not waive vulnerabilities) ==");
console.log(JSON.stringify(totals));
for (const [name, issue] of Object.entries(report.vulnerabilities || {}).sort((a, b) => a[0].localeCompare(b[0]))) {
  const advisories = (issue.via || []).filter(item => typeof item === "object");
  const advisory = advisories.map(item => ({
    title: item.title,
    url: item.url,
    range: item.range,
  }));
  console.log(JSON.stringify({
    name,
    severity: issue.severity,
    isDirect: issue.isDirect,
    range: issue.range,
    fixAvailable: issue.fixAvailable,
    effects: issue.effects,
    advisories,
    via: (issue.via || []).filter(item => typeof item === "string"),
  }));
}
if (result.error) {
  console.error(result.error);
  process.exit(1);
}
if (report.error) {
  console.error(JSON.stringify(report.error));
  process.exit(1);
}
console.log("Audit discovery complete. Use npm audit fix --dry-run to assess remediation before updating the lockfile.");
