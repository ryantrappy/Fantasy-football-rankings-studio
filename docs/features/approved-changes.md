# Approved feature changes

No production feature removal or reduction is authorized by this log.

## CHANGE-2026-10-15-151 — Retire completed redesign artifacts

- Approval date: October 15, 2026.
- User approval, this chat's TASK-151 request: “Anything that is useful in the future keep but redesign related things should be removed before we merge to main”.
- Affected IDs: TASK-145, TASK-146 and TASK-149 documentation/validation artifacts; TASK-151 cleanup. Product behavior and acceptance requirements are unchanged.
- Exact scope: remove `docs/mockups/`, the completed redesign PDF, ten one-off Manager Explorer/usability/follow-up coverage reports, and obsolete ignored root `test-results-*` folders. Replace active report links with durable UI testing guidance. Keep feature contracts, approval/task history, maintained regression tests and fixtures, canonical ranking-image baselines, analytics references, and useful current failure diagnostics.
- Compatibility: historical Backlog notes may name retired artifact paths as historical evidence. Git history retains the committed design references. This approval does not permit removing regression coverage, runtime features or future TASK-147/TASK-148 work.
- Implementation and validation: recorded in TASK-151 after integration checks.

Before reducing behavior, explain the proposal and impact, ask the user and receive
explicit approval. Append a record here before implementation with:

- Change ID and affected feature IDs.
- Previous behavior and exact approved change/user impact.
- User approval wording and conversation/task reference.
- Approval date.
- Replacement, compatibility or data migration behavior.
- Implementation and validation evidence when available.

Annotate affected area contracts with the change ID; retain their original intent
and approval history. Silence, general refactor requests, agent proposals, unchecked
templates, Done status and passing tests do not count as approval. Never manufacture
approval or expand its scope. Routine behavior-preserving changes need no approval.
