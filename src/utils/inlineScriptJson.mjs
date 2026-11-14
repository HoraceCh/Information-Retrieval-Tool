/**
 * Serialize JSON for safe embedding inside an HTML <script> element.
 * JSON.stringify alone does not escape the HTML parser's </script> end tag.
 */
export function serializeJsonForInlineScript(value) {
  const json = JSON.stringify(value);
  if (typeof json !== "string") {
    throw new TypeError("Value cannot be serialized as JSON");
  }
  return json.replace(/[<>&\u2028\u2029]/g, (char) => ({
    "<": "\\u003c",
    ">": "\\u003e",
    "&": "\\u0026",
    "\u2028": "\\u2028",
    "\u2029": "\\u2029",
  })[char]);
}
