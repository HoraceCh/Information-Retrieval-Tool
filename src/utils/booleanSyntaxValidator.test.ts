import assert from "node:assert/strict";
import test from "node:test";
import { autoFixBooleanQuery, validateBooleanQuery } from "./booleanSyntaxValidator";

test("accepts a balanced Boolean expression with nested groups", () => {
  const result = validateBooleanQuery('("robot arm" OR manipulator) AND (control OR "motion planning")');
  assert.equal(result.isValid, true);
  assert.equal(result.errors.length, 0);
});

test("does not interpret operators or parentheses inside quoted phrases", () => {
  const result = validateBooleanQuery('"AND OR NOT (robotics)" AND manipulator');
  assert.equal(result.isValid, true);
  assert.equal(result.errors.length, 0);
});

test("supports single-quoted CNKI phrases and plus as native OR", () => {
  const result = validateBooleanQuery(
    "SU = ('人工智能' + '机器人') AND TI = '机械臂'",
    { database: "CNKI 知网 (中文学术)", isFieldSpecific: true }
  );
  assert.equal(result.isValid, true);
  assert.equal(result.errors.length, 0);
});

test("accepts a Web of Science field prefix and nested groups", () => {
  const result = validateBooleanQuery(
    'TS=(("robot arm" OR manipulator) AND (control OR "motion planning"))',
    { database: "Web of Science核心合集", isFieldSpecific: true }
  );
  assert.equal(result.isValid, true);
  assert.equal(result.errors.length, 0);
});

test("accepts space-as-OR only when the selected Boolean operator style requests it", () => {
  const result = validateBooleanQuery(
    "(robotics manipulation) AND (robot arm)",
    { operatorStyle: "Space" }
  );
  assert.equal(result.isValid, true);
  assert.equal(result.errors.length, 0);
});

test("accepts CNIPA field query whitespace as OR", () => {
  const result = validateBooleanQuery(
    "TI=光伏机器人 AB=清洁",
    { database: "CNIPA (中国专利)", isFieldSpecific: true }
  );
  assert.equal(result.isValid, true);
  assert.equal(result.errors.length, 0);
});

test("reports a leading binary operator", () => {
  const result = validateBooleanQuery("AND robotics");
  assert.equal(result.isValid, false);
  assert.ok(result.errors.some(error => error.type === "DANGLING_OPERATOR"));
});

test("reports a trailing binary operator", () => {
  const result = validateBooleanQuery("robotics AND");
  assert.equal(result.isValid, false);
  assert.ok(result.errors.some(error => error.type === "DANGLING_OPERATOR"));
});

test("reports consecutive binary operators without rewriting their meaning", () => {
  const query = "robotics AND OR control";
  const result = validateBooleanQuery(query);
  assert.equal(result.isValid, false);
  assert.ok(result.errors.some(error => error.type === "CONSECUTIVE_OPERATORS"));
  assert.equal(autoFixBooleanQuery(query), query);
});

test("reports an unclosed single-quoted phrase", () => {
  const result = validateBooleanQuery("SU = 'robotics AND control");
  assert.equal(result.isValid, false);
  assert.ok(result.errors.some(error => error.type === "UNCLOSED_QUOTE"));
});

test("reports unmatched parentheses while ignoring parentheses inside phrases", () => {
  const valid = validateBooleanQuery('"robot (arm)" AND manipulator');
  const invalid = validateBooleanQuery('(robotics AND control');
  assert.equal(valid.isValid, true);
  assert.equal(invalid.isValid, false);
  assert.ok(invalid.errors.some(error => error.type === "UNMATCHED_PAREN"));
});

test("warns when adjacent groups have no explicit operator", () => {
  const result = validateBooleanQuery("(robotics OR control) (manipulation OR planning)");
  assert.equal(result.isValid, true);
  assert.ok(result.warnings.some(warning => warning.type === "MISSING_OPERATOR"));
});

test("normalizes full-width punctuation without changing Boolean operators", () => {
  const query = "（robotics AND control）";
  const result = validateBooleanQuery(query);
  assert.equal(result.isValid, false);
  assert.equal(result.fixedQuery, "(robotics AND control)");
  assert.equal(autoFixBooleanQuery("robotics OR AND control"), "robotics OR AND control");
});

test("does not treat a term containing AND as a Boolean operator", () => {
  const result = validateBooleanQuery("android AND robotics");
  assert.equal(result.isValid, true);
});
