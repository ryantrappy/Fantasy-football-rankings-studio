## Feature preservation (mandatory)

- Before planning changes, read the small [feature index](docs/feature-preservation.md), then only the relevant area contracts/sections and shared dependencies. Do not load the full catalogue archive or all contracts by default.
- Preserve existing features and important details, including reachable workflows, exports, saved content, calculations, provider support, privacy, accessibility and state. Unlisted behavior is protected too; refactor/redesign requests do not authorize reductions.
- Before removing, disabling, narrowing, hiding or changing the meaning of a feature, explain its impact, ask the user and receive explicit approval. Record the approval wording/reference, date, affected IDs and exact scope in the [approval log](docs/features/approved-changes.md) BEFORE implementing the reduction. Silence, agent proposals, Done status and passing tests are not approval; never manufacture or expand it.
- Validate affected feature IDs, retain meaningful tests, and update only affected contracts when features are completed/changed. Keep source links, user constraints and approval history. Behavior-preserving changes need no extra approval.

<!-- BACKLOG.MD MCP GUIDELINES START -->
<!-- backlog.md-instructions-version: 1.51.0 -->

<CRITICAL_INSTRUCTION>
follow the guidelines.md file

</CRITICAL_INSTRUCTION>

<CRITICAL_INSTRUCTION>

## BACKLOG WORKFLOW INSTRUCTIONS

This project uses Backlog.md MCP for all task and project management activities.

**CRITICAL GUIDANCE**

- If your client supports MCP resources, read `backlog://workflow/overview` to understand when and how to use Backlog for this project.
- If your client only supports tools or the above request fails, call `backlog.get_backlog_instructions()` to load the tool-oriented overview. Use the `instruction` selector when you need `task-creation`, `task-execution`, or `task-finalization`.

- **First time working here?** Read the overview resource IMMEDIATELY to learn the workflow
- **Already familiar?** You should have the overview cached ("## Backlog.md Overview (MCP)")
- **When to read it**: BEFORE creating tasks, or when you're unsure whether to track work

These guides cover:
- Decision framework for when to create tasks
- Search-first workflow to avoid duplicates
- Links to detailed guides for task creation, execution, and finalization
- MCP tools reference

You MUST read the overview resource to understand the complete workflow. The information is NOT summarized here.

</CRITICAL_INSTRUCTION>

<!-- BACKLOG.MD MCP GUIDELINES END -->


## Codex background model-routing authorization
- The user authorizes Codex to automatically spin up background tasks for complex, parallelizable sub-features.
- The lead agent maintains the main context window for planning, validation, and final integration.
- Max concurrency: 4 background tasks.
- Forbidden Actions: Do not auto-dispatch simple questions, production deployments, or critical security file edits.

