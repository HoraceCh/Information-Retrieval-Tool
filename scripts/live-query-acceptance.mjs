/**
 * Manual real-model acceptance; not a mocked CI test or database certification.
 * Run against an already configured trusted server. This sends two real query
 * requests through the browser, never intercepts/fulfills traffic, never accepts
 * provider keys, and records raw service output separately from any app rebuild.
 *
 * node scripts/live-query-acceptance.mjs --help
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validateQueryResult } from '../src/services/modelService.mjs';

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const database = 'Web of Science核心合集 (SCI-E/SSCI/CPCI-S)';
const englishOnly = '仅英文 (English Only)';
export const DEFAULT_CASES = [
  {
    id: 'robot-manipulators-motion-planning',
    input: 'Find research on robotic manipulators and motion planning.',
    concepts: [
      { name: 'robotic manipulators', alternatives: ['robotic manipulator', 'robotic manipulators', 'robot manipulator', 'robot manipulators', 'robot arm', 'robot arms', 'robotic arm', 'robotic arms', 'manipulator', 'manipulators', '机械臂', '机器人操作臂'] },
      { name: 'motion planning', alternatives: ['motion planning', 'path planning', 'trajectory planning', '运动规划', '路径规划', '轨迹规划'] },
    ],
    constraints: [],
  },
  {
    id: 'perovskite-solar-cells-stability',
    input: 'Find research on perovskite solar cells and long-term stability.',
    concepts: [
      { name: 'perovskite material', alternatives: ['perovskite', 'perovskites', '钙钛矿'] },
      { name: 'stability', alternatives: ['stability', 'durability', 'degradation', '稳定性', '耐久性', '降解', '老化'] },
    ],
    constraints: [
      { name: 'solar-cell application', alternatives: ['solar cell', 'solar cells', 'photovoltaic', 'photovoltaics', '太阳能电池', '光伏'] },
    ],
  },
];

const normalize = value => String(value).normalize('NFKC').toLowerCase().replace(/[‐‑‒–—]/gu, '-').replace(/\s+/gu, ' ').trim();
const digest = value => createHash('sha256').update(value).digest('hex');
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const genericTerm = /^(?:(?:concept|term|keyword|group|topic|field)(?:\s*[a-z0-9_-]+)?|search|query|web of science(?: topic)?|and|or|not|概念[一二三123]?|关键词[123]?|主题|字段)$/iu;

function containsAlternative(text, alternatives) {
  const normalized = normalize(text);
  return alternatives.find(term => {
    const value = normalize(term);
    // Latin terms must be whole lexical tokens; CJK alternatives may be substrings.
    const latin = /^[\p{Script=Latin}\p{N}\s-]+$/u.test(value);
    return latin
      ? new RegExp('(?<![\\p{L}\\p{N}_])' + escapeRegex(value) + '(?![\\p{L}\\p{N}_])', 'u').test(normalized)
      : normalized.includes(value);
  }) || null;
}

function maskDoubleQuoted(query) {
  let quoted = false;
  let result = '';
  for (let index = 0; index < query.length; index++) {
    const char = query[index];
    let slashCount = 0;
    for (let cursor = index - 1; cursor >= 0 && query[cursor] === '\\'; cursor--) slashCount++;
    if (char === '"' && slashCount % 2 === 0) quoted = !quoted;
    result += quoted || char === '"' ? ' ' : char;
  }
  return result;
}

let validatorPromise;
async function loadValidator() {
  validatorPromise ||= (async () => {
    const ts = (await import('typescript')).default;
    const source = fs.readFileSync(path.join(repository, 'src/utils/booleanSyntaxValidator.ts'), 'utf8');
    const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText;
    return { ...(await import('data:text/javascript;base64,' + Buffer.from(output).toString('base64'))), sourceSha256: digest(source) };
  })();
  return validatorPromise;
}

function distinctConceptMatches(concepts, groups) {
  const possibilities = concepts.map(concept => groups.flatMap((group, index) => containsAlternative(group.terms.join(' '), concept.alternatives) ? [index] : []));
  const visit = (facet, used, assignment) => {
    if (facet === concepts.length) return assignment;
    for (const group of possibilities[facet]) {
      if (used.has(group)) continue;
      const next = visit(facet + 1, new Set([...used, group]), [...assignment, group]);
      if (next) return next;
    }
    return null;
  };
  return { possibilities, assignment: visit(0, new Set(), []) };
}

/** Transparent lexical acceptance, not a general semantic judge or online WoS check. */
export async function assessQueryResult(result, testCase) {
  validateQueryResult(result);
  const { validateBooleanQuery } = await loadValidator();
  const meaningful = result.keywords.flatMap((group, index) => {
    const terms = [...new Set([group.original, ...group.zhSynonyms, ...group.enSynonyms].map(normalize).filter(term => term && !genericTerm.test(term)))];
    return terms.length && !genericTerm.test(normalize(group.original)) ? [{ index, terms }] : [];
  });
  const unique = [...new Map(meaningful.map(group => [JSON.stringify([...group.terms].sort()), group])).values()];
  const matches = distinctConceptMatches(testCase.concepts, unique);
  const portable = validateBooleanQuery(result.booleanQuery, { operatorStyle: 'OR' });
  const native = validateBooleanQuery(result.fieldSpecificQuery, { database, isFieldSpecific: true, operatorStyle: 'OR' });
  const stripped = maskDoubleQuoted(result.fieldSpecificQuery);
  const fields = [...stripped.matchAll(/\b([A-Z][A-Z0-9_-]*)\s*=/giu)].map(match => match[1].toUpperCase());
  // This bounded acceptance requires Topic syntax. It does not certify every WoS field.
  const allowedFields = new Set(['TS', 'TI', 'AB', 'AK', 'KP', 'PY', 'AU', 'AF', 'SO', 'DO']);
  const facets = [...testCase.concepts, ...(testCase.constraints || [])].map(facet => ({
    name: facet.name,
    portable: containsAlternative(result.booleanQuery, facet.alternatives),
    native: containsAlternative(result.fieldSpecificQuery, facet.alternatives),
  }));
  const checks = {
    atLeastTwoDistinctMeaningfulGroups: unique.length >= 2,
    conceptsMapToDifferentGroups: matches.assignment !== null,
    intentPresentInBothQueries: facets.every(facet => facet.portable && facet.native),
    portableStructureValid: portable.isValid && portable.errors.length === 0 && portable.warnings.length === 0,
    nativeStructureValid: native.isValid && native.errors.length === 0 && native.warnings.length === 0,
    nativeTopicSyntax: /^\s*TS\s*=\s*\(/iu.test(result.fieldSpecificQuery) && fields.includes('TS') && fields.every(field => allowedFields.has(field)),
    explicitAndBetweenConcepts: /\bAND\b/iu.test(maskDoubleQuoted(result.booleanQuery)) && /\bAND\b/iu.test(stripped),
    noForeignFieldSyntax: !/\bWITH\b|\b[\p{L}][\p{L}\p{N}_]*\s*:/iu.test(stripped),
  };
  return {
    pass: Object.values(checks).every(Boolean), checks, meaningfulGroupCount: unique.length,
    conceptGroupMatches: testCase.concepts.map((concept, index) => ({ name: concept.name, possibleGroupIndices: matches.possibilities[index].map(i => unique[i].index), assignedGroupIndex: matches.assignment ? unique[matches.assignment[index]].index : null })),
    intentMatches: facets, recognizedFields: fields, portableValidation: portable, nativeValidation: native,
  };
}

function parseArguments(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index++) {
    const key = argv[index];
    if (key === '--help' || key === '-h') { args.help = true; continue; }
    assert(['--app-url', '--service-url', '--provider', '--model', '--browser-path', '--browser-channel', '--cases', '--output', '--timeout-ms'].includes(key), `Unknown option: ${key}`);
    assert(argv[index + 1] && !argv[index + 1].startsWith('--'), `Missing value: ${key}`);
    args[key.slice(2)] = argv[++index];
  }
  return args;
}

function safeUrl(value, label) {
  assert(typeof value === 'string' && value.trim(), `${label} must be configured explicitly`);
  const url = new URL(value);
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  assert(!url.username && !url.password && !url.search && !url.hash, `${label} cannot contain credentials, query parameters or fragments`);
  assert(url.protocol === 'https:' || (url.protocol === 'http:' && loopback), `${label} requires HTTPS except on loopback`);
  return url.toString().replace(/\/$/u, '');
}

function validateCases(cases) {
  assert(Array.isArray(cases) && cases.length >= 2 && cases.length <= 6, 'Use two to six explicit acceptance cases');
  assert(new Set(cases.map(item => item.id)).size === cases.length, 'Case ids must be unique');
  assert(new Set(cases.map(item => normalize(item.input))).size === cases.length, 'Cases must test distinct topics');
  for (const item of cases) {
    assert(/^[a-z0-9][a-z0-9_-]{0,63}$/u.test(item.id), 'Case ids must be safe artifact names');
    assert(typeof item.input === 'string' && item.input.trim() && !/[\r\n]/u.test(item.input), 'Each case must have a single nonempty topic line');
    assert(Array.isArray(item.concepts) && item.concepts.length >= 2, 'Each topic requires at least two explicit concept facets');
    for (const facet of [...item.concepts, ...(item.constraints || [])]) {
      assert(typeof facet.name === 'string' && facet.name.trim() && Array.isArray(facet.alternatives) && facet.alternatives.length && facet.alternatives.every(term => typeof term === 'string' && term.trim()), 'Each facet needs a name and explicit lexical alternatives');
    }
  }
}

function resultForEvidence(result) {
  return {
    keywords: result.keywords, booleanQuery: result.booleanQuery, fieldSpecificQuery: result.fieldSpecificQuery,
    schemaMapping: result.schemaMapping, explanation: result.explanation,
    ...(result._modelUsed ? { modelUsed: result._modelUsed } : {}),
    ...(result._providerUsed ? { providerUsed: result._providerUsed } : {}),
    ...(Number.isFinite(result._latencyMs) ? { appLatencyMs: result._latencyMs } : {}),
  };
}

function waitForLiveResponse(page, endpoint, timeout) {
  let timer;
  let onResponse;
  let onFailure;
  const promise = new Promise((resolve, reject) => {
    onResponse = response => {
      if (response.url() === endpoint && response.request().method() === 'POST') resolve(response);
    };
    onFailure = request => {
      if (request.url() === endpoint && request.method() === 'POST') reject(new Error('Real model request failed: ' + (request.failure()?.errorText || 'unknown network failure')));
    };
    page.on('response', onResponse);
    page.on('requestfailed', onFailure);
    timer = setTimeout(() => reject(new Error(`No real model POST response within ${timeout} ms`)), timeout);
  });
  // A click/navigation exception may happen before this promise is awaited.
  promise.catch(() => {});
  return { promise, dispose() { clearTimeout(timer); page.off('response', onResponse); page.off('requestfailed', onFailure); } };
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArguments(argv);
  if (args.help) {
    console.log(`Manual live Web of Science acceptance (two real model requests by default).

PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node scripts/live-query-acceptance.mjs \\
  --app-url http://127.0.0.1:4173 --service-url http://127.0.0.1:8000 \\
  --provider local-qwen --model qwen2.5-3b --browser-channel chrome

Options map to LIVE_APP_URL (or SMOKE_BASE_URL), LIVE_MODEL_SERVICE_URL,
LIVE_PROVIDER, LIVE_MODEL, LIVE_BROWSER_PATH (or CHROMIUM_PATH),
LIVE_BROWSER_CHANNEL, LIVE_QUERY_CASES, LIVE_QUERY_OUTPUT and LIVE_TIMEOUT_MS.
LIVE_HEADLESS=false opens a visible browser; default is headless.
No API key argument/environment variable is accepted. Configure credentials only
on your trusted server. No request interception, canned response or TLS bypass is
used. Default timeout is 120000 ms; the app's own request deadline is unchanged.

Optional --cases JSON is an array of 2–6 objects shaped like DEFAULT_CASES in
this script: id, input, concepts[{name, alternatives[]}], constraints[]. Its explicit
lexical checks are transparent acceptance criteria, not a semantic certification.
The report keeps service output and app-rebuilt output separate. A successful
structure check does not certify live Web of Science syntax, relevance or recall.`);
    return;
  }
  const appUrl = safeUrl(args['app-url'] || process.env.LIVE_APP_URL || process.env.SMOKE_BASE_URL || 'http://127.0.0.1:4173', 'App URL');
  const serviceUrl = safeUrl(args['service-url'] || process.env.LIVE_MODEL_SERVICE_URL, 'Trusted model service URL');
  const provider = args.provider || process.env.LIVE_PROVIDER;
  const model = args.model || process.env.LIVE_MODEL;
  assert(typeof provider === 'string' && /^[a-zA-Z0-9_.-]{1,80}$/u.test(provider), 'Specify the actual trusted-server provider id with --provider or LIVE_PROVIDER');
  assert(typeof model === 'string' && model.trim(), 'Specify the actual model with --model or LIVE_MODEL');
  const timeout = Number(args['timeout-ms'] || process.env.LIVE_TIMEOUT_MS || 120000);
  assert(Number.isFinite(timeout) && timeout >= 1000 && timeout <= 300000, 'Timeout must be 1000–300000 ms');
  const casesPath = args.cases || process.env.LIVE_QUERY_CASES;
  const cases = casesPath ? JSON.parse(fs.readFileSync(casesPath, 'utf8')) : DEFAULT_CASES;
  validateCases(cases);
  const output = path.resolve(args.output || process.env.LIVE_QUERY_OUTPUT || 'artifacts/live-query-acceptance');
  fs.mkdirSync(output, { recursive: true });
  const validator = await loadValidator();
  const endpoint = serviceUrl + '/api/ai/generate';
  const report = {
    recordedAtUtc: new Date().toISOString(), status: 'BLOCKED', appUrl, trustedService: serviceUrl, endpoint,
    requestedProvider: provider, requestedModel: model, database, language: englishOnly,
    template: 'preset-topic-constraint-field (unchanged application default)', operatorStyle: 'OR', casesSha256: digest(JSON.stringify(cases)), validatorSourceSha256: validator.sourceSha256,
    kind: 'MANUAL LIVE BROWSER → TRUSTED SERVICE; no mocked/replayed responses', cases: [],
    limitations: ['The operator must retain server/model provenance to establish the actual backend; HTTP observation alone cannot audit server internals.', 'Intent checks use explicit lexical alternatives for these topics, not a general semantic judge.', 'Native field/structure checks are bounded acceptance, not live Web of Science certification or recall measurement.', 'If the app rebuilds query syntax, that output is recorded separately from the model response and must be disclosed.'],
  };
  try { report.repositoryHeadAtRun = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim(); } catch { /* A source archive need not include Git. */ }
  const modulePath = process.env.PLAYWRIGHT_MODULE;
  const { chromium } = modulePath ? await import(pathToFileURL(path.resolve(modulePath)).href) : await import('playwright');
  const executablePath = args['browser-path'] || process.env.LIVE_BROWSER_PATH || process.env.CHROMIUM_PATH;
  const channel = args['browser-channel'] || process.env.LIVE_BROWSER_CHANNEL;
  let browser;
  try {
    browser = await chromium.launch({ headless: process.env.LIVE_HEADLESS !== 'false', ...(executablePath ? { executablePath } : channel ? { channel } : {}), args: ['--no-sandbox'] });
    report.browser = { version: await browser.version(), executablePath: executablePath || null, channel: channel || null };
    for (const testCase of cases) {
      const record = { id: testCase.id, topic: testCase.input, status: 'FAIL', expectedConcepts: testCase.concepts, constraints: testCase.constraints || [], pageErrors: [] };
      report.cases.push(record);
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      page.setDefaultTimeout(15000);
      page.on('pageerror', error => record.pageErrors.push(error.message));
      await page.addInitScript(({ provider, model, serviceUrl }) => {
        localStorage.setItem('visited-guided-search-v1.0', 'true');
        localStorage.setItem('ai_retrieval_providers', JSON.stringify([{ id: provider, name: 'Live acceptance model', isGemini: false, serviceUrl, models: model }]));
        localStorage.setItem('ai_retrieval_active_prov', provider);
        localStorage.setItem('ai_retrieval_active_mod', model);
        localStorage.setItem('ai_retrieval_compare_mode', 'false');
        localStorage.setItem('ai_retrieval_operator_style', 'OR');
      }, { provider, model, serviceUrl });
      let pending;
      try {
        console.log(`[${testCase.id}] Starting real browser request; no fixtures/cache.`);
        await page.goto(appUrl, { waitUntil: 'networkidle', timeout: 30000 });
        await page.getByRole('combobox', { name: 'Model A', exact: true }).selectOption(`${provider}:${model}`);
        await page.getByRole('combobox', { name: 'Target database', exact: true }).selectOption(database);
        await page.getByRole('combobox', { name: 'Query language', exact: true }).selectOption(englishOnly);
        record.selectedTemplate = await page.getByRole('combobox', { name: 'Query framework template', exact: true }).inputValue();
        assert.equal(record.selectedTemplate, 'preset-topic-constraint-field', 'Acceptance must exercise the unchanged default Topic + Constraint + Field preset');
        await page.locator('#query-intent').fill(testCase.input);
        record.appAssetUrls = await page.locator('script[src]').evaluateAll(nodes => nodes.map(node => node.src));
        pending = waitForLiveResponse(page, endpoint, timeout);
        const started = performance.now();
        await page.getByRole('button', { name: /GENERATE[_ ]?QUERY|生成检索式/iu }).first().click();
        const response = await pending.promise;
        record.browserResponseLatencyMs = Math.round(performance.now() - started);
        record.httpStatus = response.status();
        const request = response.request();
        const body = request.postDataJSON();
        const headers = request.headers();
        record.request = {
          method: request.method(), url: request.url(), provider: body.provider, model: body.model, operation: body.operation,
          keys: Object.keys(body).sort(), contentsSha256: digest(String(body.contents)), systemInstructionSha256: digest(String(body.systemInstruction)),
          containsRequestedTopic: typeof body.contents === 'string' && (body.contents.includes(testCase.input) || body.contents.includes(JSON.stringify(testCase.input))),
          targetsWebOfScience: typeof body.contents === 'string' && /Web of Science/iu.test(body.contents),
          hasBrowserAuthorizationHeader: Boolean(headers.authorization || headers['x-api-key'] || headers['x-goog-api-key']),
        };
        assert.equal(record.httpStatus, 200, 'The real trusted service did not return HTTP 200');
        assert.equal(body.provider, provider, 'Browser requested an unintended provider');
        assert.equal(body.model, model, 'Browser requested an unintended model');
        assert.equal(body.operation, 'query', 'Browser did not use the query operation');
        assert.deepEqual(record.request.keys, ['contents', 'model', 'operation', 'provider', 'systemInstruction']);
        assert(record.request.containsRequestedTopic && record.request.targetsWebOfScience, 'The actual request lost topic/database intent');
        assert(!record.request.hasBrowserAuthorizationHeader, 'Browser unexpectedly sent provider-style credentials');
        const envelope = await response.json();
        assert.equal(envelope.provider, provider, 'Service response changed the provider');
        assert.equal(envelope.model, model, 'Service response changed the model');
        const raw = validateQueryResult(envelope.result);
        record.rawServiceResult = resultForEvidence(raw);
        record.rawServiceAssessment = await assessQueryResult(raw, testCase);
        await page.waitForFunction(input => {
          const items = JSON.parse(localStorage.getItem('ai_retrieval_history') || '[]');
          return items.some(item => item.input === input && item.result && !item.result._isError && !item.result._isLoading);
        }, testCase.input, { timeout: 15000 });
        const final = await page.evaluate(input => JSON.parse(localStorage.getItem('ai_retrieval_history') || '[]').find(item => item.input === input).result, testCase.input);
        assert(!final._fromCache, 'An old cached result cannot satisfy live acceptance');
        assert.equal(final._modelUsed, model, 'Rendered result does not identify the requested model');
        record.applicationResult = resultForEvidence(final);
        record.finalAssessment = await assessQueryResult(final, testCase);
        const code = page.locator('.formula-code-box').first();
        await code.waitFor({ state: 'visible' });
        await page.waitForFunction(expected => {
          const text = document.querySelector('.formula-code-box')?.textContent || '';
          return text.replace(/\s+/gu, ' ').trim() === expected.replace(/\s+/gu, ' ').trim();
        }, final.fieldSpecificQuery, { timeout: 15000 });
        record.renderedFieldQuery = await code.innerText();
        record.appRebuiltSyntax = raw.booleanQuery !== final.booleanQuery || raw.fieldSpecificQuery !== final.fieldSpecificQuery;
        record.rebuildDisclosed = /rebuilt from the extracted concept groups/iu.test(final.explanation);
        record.conceptGroupsPreservedFromService = JSON.stringify(raw.keywords) === JSON.stringify(final.keywords);
        assert(record.conceptGroupsPreservedFromService, 'App must not silently invent replacement model concepts');
        assert(!record.appRebuiltSyntax || record.rebuildDisclosed, 'Application syntax rebuild was not disclosed');
        assert(record.finalAssessment.pass, 'Final query failed intent/concept/TS=/database structure acceptance: ' + Object.entries(record.finalAssessment.checks).filter(([, pass]) => !pass).map(([check]) => check).join(', '));
        assert.equal(record.pageErrors.length, 0, 'The accepted browser path raised an uncaught error');
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({ path: path.join(output, `${testCase.id}.png`), fullPage: true });
        record.status = record.appRebuiltSyntax ? 'PASS WITH WARNINGS' : 'PASS';
        console.log(`[${testCase.id}] ${record.status}; HTTP ${record.httpStatus}; ${record.finalAssessment.meaningfulGroupCount} groups; ${record.browserResponseLatencyMs} ms.`);
      } catch (error) {
        record.failure = error.message;
        record.visibleError = await page.locator('body').innerText().then(text => text.slice(-4000)).catch(() => 'Page could not be read');
        await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
        await page.screenshot({ path: path.join(output, `${testCase.id}-failure.png`), fullPage: true }).catch(() => {});
        console.error(`[${testCase.id}] FAIL: ${error.message}`);
      } finally {
        pending?.dispose();
        await context.close();
        fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
      }
      if (record.status === 'FAIL' && record.httpStatus === undefined) {
        for (const remaining of cases.slice(report.cases.length)) report.cases.push({ id: remaining.id, topic: remaining.input, status: 'BLOCKED', failure: 'Prior live model request did not produce a response; backend work may still be running. No overlapping inference was started.' });
        break;
      }
    }
    const failed = report.cases.some(item => ['FAIL', 'BLOCKED'].includes(item.status));
    report.status = failed ? 'FAIL' : report.cases.some(item => item.status === 'PASS WITH WARNINGS') ? 'PASS WITH WARNINGS' : 'PASS';
    if (failed) process.exitCode = 1;
  } catch (error) {
    report.failure = error.message;
    process.exitCode = 1;
  } finally {
    await browser?.close();
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  }
  console.log(`${report.status}: ${report.cases.filter(item => item.status.startsWith('PASS')).length}/${cases.length} live topics accepted. Evidence: ${output}`);
  return report;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
