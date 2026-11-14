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
  const common = validateBooleanQuery('"solar" NEAR/5 "panel"', {
    database: "Web of Science核心合集", isFieldSpecific: true
  });
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

test("does not reserve ordinary words as operators in portable queries", () => {
  for (const query of ["same sex robotics", "robot with gripper", "XOR gate"]) {
    const result = validateBooleanQuery(query);
    assert.equal(result.errors.length, 0, query);
  }
});
test("recognizes PubScholar pipe OR without surrounding spaces and implicit AND", () => {
  const options = { database: "百度学术 / PubScholar", isFieldSpecific: true };
  const explicit = validateBooleanQuery("robotics|manipulator", options);
  assert.equal(explicit.isValid, true);
  assert.equal(explicit.warnings.length, 0);
  const implicit = validateBooleanQuery("robotics control", options);
  assert.equal(implicit.isValid, true);
  assert.equal(implicit.warnings.length, 0);
});
test("recognizes native minus exclusion in web search queries", () => {
  const result = validateBooleanQuery("robotics -medical", {
    database: "通用搜索引擎 (Baidu/Bing)", isFieldSpecific: true
  });
  assert.equal(result.isValid, true);
  assert.equal(result.warnings.length, 0);
});
test("recognizes CNKI symbol operators without splitting hyphenated terms", () => {
  const options = { database: "CNKI 知网 (中文学术)", isFieldSpecific: true };
  const result = validateBooleanQuery("SU = ('robot arm' * 'manipulator' + 'robotics')", options);
  assert.equal(result.isValid, true);
  assert.equal(result.warnings.length, 0);
  assert.equal(validateBooleanQuery("TI = COVID-19", options).errors.length, 0);
});
test("recognizes Springer ampersand as AND", () => {
  const result = validateBooleanQuery("TI=robot & AB=gripper", {
    database: "Springer Nature Link", isFieldSpecific: true
  });
  assert.equal(result.isValid, true);
  assert.equal(result.warnings.length, 0);
});
test("recognizes only database-supported positional operators", () => {
  const wos = validateBooleanQuery('"robot" NEAR/5 "arm"', {
    database: "Web of Science核心合集", isFieldSpecific: true
  });
  assert.equal(wos.isValid, true);
  assert.equal(wos.warnings.length, 0);
  const patent = validateBooleanQuery("robot ADJ arm", {
    database: "Espacenet / USPTO (外文专利)", isFieldSpecific: true
  });
  assert.equal(patent.isValid, true);
  assert.equal(patent.warnings.length, 0);
  const yizhuanli = validateBooleanQuery("robot 5N arm", {
    database: "壹专利 (中文专利)", isFieldSpecific: true
  });
  assert.equal(yizhuanli.isValid, true);
  assert.equal(yizhuanli.warnings.length, 0);
});
test("keeps positional-looking words as terms when they are not between operands", () => {
  const result = validateBooleanQuery("same sex robotics", {
    database: "Web of Science核心合集", isFieldSpecific: true
  });
  assert.equal(result.errors.length, 0);
});
test("does not normalize full-width punctuation inside quoted content", () => {
  const query = '“机器人（机械臂）：清洁” AND control';
  assert.equal(autoFixBooleanQuery(query), '"机器人（机械臂）：清洁" AND control');
  const literal = validateBooleanQuery('"robot（arm）" AND control');
  assert.equal(literal.stats.hasFullwidth, false);
  assert.equal(literal.errors.some(error => error.type === "FULLWIDTH_CHAR"), false);
});

test("warns when whitespace semantics are ambiguous across combined patent platforms", () => {
  const result = validateBooleanQuery("robotics manipulation", {
    database: "Espacenet / USPTO (外文专利)", isFieldSpecific: true
  });
  assert.equal(result.isValid, true);
  assert.ok(result.warnings.some(warning => warning.type === "MISSING_OPERATOR"));
});
