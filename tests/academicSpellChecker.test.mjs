import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../src/utils/academicSpellChecker.ts", import.meta.url), "utf8");
const transpiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 }
}).outputText;
const moduleUrl = "data:text/javascript;base64," + Buffer.from(transpiled).toString("base64");
const {
  checkAcademicSpelling,
  applySpellCorrection,
  applyAllSpellCorrections,
  replaceWordOccurrence
} = await import(moduleUrl);

test("detects common English academic misspellings across domains", () => {
  const query = '("nueral netwrok" OR algoritm) AND ("diabeties retinopahy" OR alzhimer)';
  const issues = checkAcademicSpelling(query);
  const byWord = Object.fromEntries(issues.map((i) => [i.word, i.suggestions[0]]));

  assert.equal(byWord.nueral, "neural");
  assert.equal(byWord.netwrok, "network");
  assert.equal(byWord.algoritm, "algorithm");
  assert.equal(byWord.diabeties, "diabetes");
  assert.equal(byWord.retinopahy, "retinopathy");
  assert.equal(byWord.alzhimer, "Alzheimer");
});

test("detects common Chinese academic spelling errors", () => {
  const input = "基于深度学系与神经网路的糖尿并视网膜病便筛查文献综诉，分析其召回律与阀值";
  const issues = checkAcademicSpelling(input);
  const byWord = Object.fromEntries(issues.map((i) => [i.word, i.suggestions[0]]));

  assert.equal(byWord["深度学系"], "深度学习");
  assert.equal(byWord["神经网路"], "神经网络");
  assert.equal(byWord["糖尿并"], "糖尿病");
  assert.equal(byWord["视网膜病便"], "视网膜病变");
  assert.equal(byWord["文献综诉"], "文献综述");
  assert.equal(byWord["召回律"], "召回率");
  assert.equal(byWord["阀值"], "阈值");
});

test("catches unseen academic typos via bounded fuzzy matching", () => {
  const issues = checkAcademicSpelling("algorihm for retinoapthy and trasformer");
  const byWord = Object.fromEntries(issues.map((i) => [i.word, i.suggestions[0]]));

  assert.equal(byWord.algorihm, "algorithm");
  assert.equal(byWord.retinoapthy, "retinopathy");
  assert.equal(byWord.trasformer, "transformer");
});

test("preserves original casing in suggestions", () => {
  const issues = checkAcademicSpelling("Algoritm AND NUERAL");
  assert.equal(issues[0].suggestions[0], "Algorithm");
  assert.equal(issues[1].suggestions[0], "NEURAL");
});

test("does not falsely flag valid US/UK academic spellings", () => {
  const validText =
    '("behavioural modelling" OR "randomized trial" OR "randomised trial") AND (optimisation OR optimization OR tumour OR tumor OR analyse OR analyze)';
  const issues = checkAcademicSpelling(validText);
  assert.equal(issues.length, 0);
});

test("skips Boolean operators, field prefixes, bracket tags, acronyms, and wildcards", () => {
  const query =
    'TITLE-ABS-KEY((comput* OR analy* OR behav?r) AND ("CRISPR" OR "fMRI" OR "LLM") NEAR/3 ("machine learning"[MeSH Terms] OR "deep learning"[tiab]))';
  const issues = checkAcademicSpelling(query);
  assert.equal(issues.length, 0);
});

test("applies single and bulk spelling corrections without corrupting Boolean syntax", () => {
  const query = '("nueral netwrok" OR algoritm) AND "diabeties retinopahy"';
  const issues = checkAcademicSpelling(query);

  const singleFixed = applySpellCorrection(query, issues[0], issues[0].suggestions[0]);
  assert.equal(singleFixed, '("neural netwrok" OR algoritm) AND "diabeties retinopahy"');

  const allFixed = applyAllSpellCorrections(query, issues);
  assert.equal(allFixed, '("neural network" OR algorithm) AND "diabetes retinopathy"');
  assert.equal(checkAcademicSpelling(allFixed).length, 0);
});

test("respects ignoredWords list and replaces whole words safely", () => {
  const text = "algoritm and nueral";
  const issues = checkAcademicSpelling(text, { ignoredWords: ["algoritm"] });
  assert.equal(issues.length, 1);
  assert.equal(issues[0].word, "nueral");

  assert.equal(replaceWordOccurrence("algoritm OR algoritms", "algoritm", "algorithm"), "algorithm OR algoritms");
});
