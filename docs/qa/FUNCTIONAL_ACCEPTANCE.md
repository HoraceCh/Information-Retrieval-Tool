# Functional acceptance before ordered merges

This follow-up has two gates. The real browser test uses an actual text model behind the trusted gateway. The commercial speech test exercises the documented integration contract with local HTTP transport fixtures. An operator still needs a valid provider key and model entitlement to make billable commercial requests.

| Gate | Pass criteria |
| --- | --- |
| Web of Science query generation | Run two different topics through the production build, a trusted gateway, and a real model. Each result retains both concepts, contains at least two usable keyword groups, and renders an explicit Boolean expression and a Web of Science `TS=(…)` expression. The final mapped expression must pass the structural validator without structural warnings. Keep the upstream draft and final rendered output in the report so any repair is visible. |
| Commercial speech integration | Check official Gemini, OpenAI and Deepgram instructions for authentication, request encoding, supported audio and model selection, response extraction and error behavior. Run local transport tests against the real adapter code using the documented response shapes. Use English and Mandarin fixtures and cover provider-specific audio constraints. Remote account authorization and commercial model accuracy are outside this acceptance scope. |

The Web of Science repair applies to ordinary topic searches. It builds a draft from the model's extracted concepts when the native output or portable logic is malformed. The model's valid native output is preserved. The built-in Topic + Constraint + Field preset also uses this path when its definition is unchanged. Explicit operators, field constraints, other templates and feedback stay on the existing advanced generation path. Generated expressions still require review for suitability in the target database.
