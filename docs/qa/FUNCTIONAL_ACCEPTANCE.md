# Functional acceptance before ordered merges

This follow-up has two gates. The real browser test uses an actual text model behind the trusted gateway. The commercial speech test exercises the documented integration contract with local HTTP transport fixtures. An operator still needs a valid provider key and model entitlement to make billable commercial requests.

| Gate | Pass criteria |
| --- | --- |
| Web of Science query generation | Run two different topics through the production build, a trusted gateway, and a real model. Each result retains both concepts, contains at least two usable keyword groups, and renders an explicit Boolean expression and a Web of Science `TS=(…)` expression. The final mapped expression must pass the structural validator without structural warnings. Keep the upstream draft and final rendered output in the report so any repair is visible. |
| Commercial speech integration | Check official Gemini, OpenAI and Deepgram instructions for authentication, request encoding, supported audio and model selection, response extraction and error behavior. Run local transport tests against the real adapter code using the documented response shapes. Use English and Mandarin fixtures and cover provider-specific audio constraints. Remote account authorization and commercial model accuracy are outside this acceptance scope. |

The Web of Science repair applies to ordinary topic searches. It builds a draft from the model's extracted concepts when the native output or portable logic is malformed. The model's valid native output is preserved. The built-in Topic + Constraint + Field preset also uses this path when its definition is unchanged. Explicit operators, field constraints, other templates and feedback stay on the existing advanced generation path. Generated expressions still require review for suitability in the target database.

## Results on 2026-11-27

| Gate | Status | Evidence |
| --- | --- | --- |
| Web of Science query generation | PASS WITH WARNINGS | Branded Chrome sent two real requests through the trusted gateway to local Qwen2.5 3B. Robotics and perovskite topics returned HTTP 200 in 26.3 s and 18.0 s. Each retained two concepts and rendered a warning-free `TS=(…)` expression after the app rebuilt the syntax. The test preserves the original model output and the repair notice. |
| Commercial speech integration | PASS WITH WARNINGS | Gemini, OpenAI and Deepgram adapters satisfy the manuals in 42 local HTTP transport cases. Provider credentials, quota and recognition accuracy were outside this acceptance scope. |

The text run used the unchanged default Topic + Constraint + Field template. It confirms the tested generation and repair flow. The generated queries were structurally checked locally. They were not submitted to a live Web of Science database.

- [Raw and rendered query evidence](evidence/wos-live-acceptance.json)
- [Reproducible live browser harness](../../scripts/live-query-acceptance.mjs)
- [Commercial vendor manuals and transport tests](../../services/speech-whisper/COMMERCIAL_API_ACCEPTANCE.md)
