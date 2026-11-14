import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../src/utils/booleanSyntaxValidator.ts", import.meta.url), "utf8");
const transpiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 }
}).outputText;
const moduleUrl = "data:text/javascript;base64," + Buffer.from(transpiled).toString("base64");
const { validateBooleanQuery, autoFixBooleanQuery } = await import(moduleUrl);

test("accepts balanced portable Boolean expressions", () => {
  const result = validateBooleanQuery('("robot arm" OR manipulator) AND (control OR "motion planning")');
  assert.equal(result.isValid, true);
  assert.equal(result.errors.length, 0);
});
test("ignores operators and parentheses inside quoted phrases", () => {
  const result = validateBooleanQuery('"AND OR NOT (robotics)" AND manipulator');
  assert.equal(result.isValid, true);
  assert.equal(result.stats.phraseCount, 1);
});
test("supports CNKI single-quoted phrases and plus-as-OR", () => {
  const result = validateBooleanQuery("SU = ('人工智能' + '机器人') AND TI = '机械臂'", {
    database: "CNKI 知网 (中文学术)", isFieldSpecific: true
  });
  assert.equal(result.isValid, true);
  assert.equal(result.stats.phraseCount, 3);
  assert.equal(result.stats.doubleQuotes, 0);
});
test("accepts Web of Science field prefixes and nested groups", () => {
  const result = validateBooleanQuery('TS=(("robot arm" OR manipulator) AND (control OR "motion planning"))', {
    database: "Web of Science核心合集", isFieldSpecific: true
  });
  assert.equal(result.isValid, true);
  assert.equal(result.stats.phraseCount, 2);
});
test("uses space-as-OR only for portable queries when selected", () => {
  const result = validateBooleanQuery("(robotics manipulation) AND (robot arm)", { operatorStyle: "Space" });
  assert.equal(result.isValid, true);
  assert.equal(result.warnings.length, 0);
});
test("accepts explicit CNIPA field logic and protects localized field labels", () => {
  const query = "发明名称=(面板 OR 太阳能板) AND 申请人所在国（省）=(浙江)";
  const result = validateBooleanQuery(query, { database: "CNIPA (中国专利)", isFieldSpecific: true });
  assert.equal(result.isValid, true);
  assert.equal(result.errors.length, 0);
  assert.equal(result.warnings.length, 0);
  assert.equal(result.stats.openParens, 2);
  assert.equal(result.stats.closeParens, 2);
  assert.equal(result.stats.hasFullwidth, false);
});
test("does not infer CNIPA whitespace as OR across advanced-search fields", () => {
  const result = validateBooleanQuery("发明名称=(面板) 摘要=(清洁)", {
    database: "CNIPA (中国专利)", isFieldSpecific: true
  });
  assert.equal(result.isValid, true);
  assert.ok(result.warnings.some(warning => warning.type === "MISSING_OPERATOR"));
});
test("does not infer CNIPA whitespace as OR inside a command-line field", () => {
  const result = validateBooleanQuery("发明名称=(面板 太阳能板)", {
    database: "CNIPA (中国专利)", isFieldSpecific: true
  });
  assert.equal(result.isValid, true);
  assert.ok(result.warnings.some(warning => warning.type === "MISSING_OPERATOR"));
});
test("warns on generic adjacent clauses without explicit operators", () => {
  const result = validateBooleanQuery("(robotics OR control) (manipulation OR planning)");
  assert.equal(result.isValid, true);
  assert.ok(result.warnings.some(warning => warning.type === "MISSING_OPERATOR"));
});
test("reports leading and trailing operators", () => {
  assert.equal(validateBooleanQuery("AND robotics").isValid, false);
  assert.equal(validateBooleanQuery("robotics AND").isValid, false);
});
test("reports consecutive operators without rewriting their meaning", () => {
  const query = "robotics AND OR control";
  const result = validateBooleanQuery(query);
  assert.equal(result.isValid, false);
  assert.ok(result.errors.some(error => error.type === "CONSECUTIVE_OPERATORS"));
  assert.equal(autoFixBooleanQuery(query), query);
});
test("reports unclosed single-quoted phrases", () => {
  const result = validateBooleanQuery("SU = 'robotics AND control");
  assert.equal(result.isValid, false);
  assert.ok(result.errors.some(error => error.type === "UNCLOSED_QUOTE"));
});
test("reports unmatched parentheses and ignores parentheses inside phrases", () => {
  assert.equal(validateBooleanQuery('"robot (arm)" AND manipulator').isValid, true);
  const invalid = validateBooleanQuery("(robotics AND control");
  assert.equal(invalid.isValid, false);
  assert.ok(invalid.errors.some(error => error.type === "UNMATCHED_PAREN"));
});
test("counts parentheses and single-quoted phrases correctly", () => {
  const result = validateBooleanQuery("((robotics AND 'control systems'))");
  assert.equal(result.stats.openParens, 2);
  assert.equal(result.stats.closeParens, 2);
  assert.equal(result.stats.phraseCount, 1);
});
test("warns about empty parentheses", () => {
  const result = validateBooleanQuery("robotics AND ()");
  assert.ok(result.warnings.some(warning => warning.type === "EMPTY_PAREN"));
});
test("normalizes punctuation only and preserves localized field labels", () => {
  const result = validateBooleanQuery("（robotics AND control）");
  assert.equal(result.fixedQuery, "(robotics AND control)");
  assert.equal(autoFixBooleanQuery("robotics OR AND control"), "robotics OR AND control");
  assert.equal(autoFixBooleanQuery("申请人所在国（省）=（浙江）"), "申请人所在国（省）=(浙江)");
});
test("does not interpret a term containing AND as an operator", () => {
  assert.equal(validateBooleanQuery("android AND robotics").isValid, true);
});
test("accepts common and CNIPA proximity operators", () => {
  const common = validateBooleanQuery('"solar" NEAR/5 "panel"');
  const cnipa = validateBooleanQuery("发明名称=(光伏) AND 摘要=(清洁 1W 机器人)", {
    database: "CNIPA (中国专利)", isFieldSpecific: true
  });
  assert.equal(common.isValid, true);
  assert.equal(cnipa.isValid, true);
  assert.equal(cnipa.warnings.length, 0);
});
test("reports a field label with no value", () => {
  const result = validateBooleanQuery("TI= AND AB=robotics", { isFieldSpecific: true });
  assert.equal(result.isValid, false);
  assert.ok(result.errors.some(error => error.type === "MISSING_FIELD_VALUE"));
});
