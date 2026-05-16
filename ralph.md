# Ralph Agent Instructions

## ⛔ CRITICAL CONSTRAINT — READ THIS FIRST

You must implement exactly ONE top-level task per invocation. This is non-negotiable.

- ONE top-level task means: a single root-level item (e.g., `1.`, `2.`, `3.`) and all of its subtasks (e.g., `2.1`, `2.2`, `2.3`).
- After completing that one top-level task and its subtasks, you MUST STOP implementing. Do not continue to the next top-level task. Instead, proceed to Phase 5 (Verify Exit Criteria) and Phase 6 (Update Tracking) for the task you just completed.
- Do not implement, touch, or mark any other top-level task — even if it seems small, related, or easy.
- If you catch yourself thinking "I can also knock out task N while I'm here" — STOP implementing. That is exactly the behavior this rule prohibits. Move on to verification and tracking for your one task.
- Violating this constraint invalidates the entire run.

## Phase 1: Load Context

Read the following files to understand the project. Skip any that don't exist.

1. `.kiro/steering/product.md` — what the product is
2. `.kiro/steering/structure.md` — project structure conventions
3. `.kiro/steering/tech.md` — tech stack and tooling
4. `.kiro/specs/SPECS_NAME/requirements.md` — requirements and exit criteria
5. `.kiro/specs/SPECS_NAME/design.md` — architecture and design decisions
6. `.kiro/specs/SPECS_NAME/tasks.md` — the task list to implement
7. `.kiro/specs/SPECS_NAME/progress.md` — **read the top sections (Corrections and Codebase Patterns) FIRST and internalize them before doing anything else**, then review past progress entries

## Phase 2: Pick ONE Task

1. Find the lowest-numbered **top-level** task in `tasks.md` that is NOT marked with `[X]`. A top-level task is one at the root indentation level (e.g., `- [ ] 1.`, `- [ ] 2.`). Subtasks nested under a top-level task (e.g., `1.1`, `1.2`) are NOT independent tasks — they are part of their parent and will be implemented together with it.
2. Read the requirement(s) and exit criteria referenced by that task in `requirements.md`
3. Read the relevant design details in `design.md`
4. Do NOT pick more than one top-level task. You implement exactly one top-level task (including all of its subtasks) per invocation. You must NOT mark any other top-level task as complete — only the one you pick here.

## Phase 3: Understand Before Implementing

Before writing any code:

1. Read the existing source files that are relevant to the task
2. Understand the current patterns, naming conventions, and structure already in use
3. **Re-read the Corrections section** at the top of `progress.md` with your chosen task in mind. Every entry there is a mistake a previous iteration already made and fixed. Do not repeat them. Apply every relevant correction proactively to the task you are about to implement.

## Phase 4: Implement

1. Implement the task and all its subtasks in their specified order
2. Follow the project's existing conventions and patterns
3. After implementation, run typecheck and tests as applicable to the project
4. If a command fails or a test breaks:
   a. Fix the issue
   b. **Immediately ask yourself: "Could a future iteration hit this same problem?"** If yes, add it to the Corrections section at the top of `progress.md` RIGHT NOW, before continuing. Do not wait until the end.
   c. If you cannot resolve a failure after 5 attempts, add it to the Corrections section as an unresolved blocker, mark the task as failed in `tasks.md` (e.g., `[F]`), and move on to Phase 6 to record what happened. Do NOT mark the task with `[X]`.
5. **STOP CHECK:** You have now finished implementing your one top-level task. Do NOT proceed to implement any other top-level task. Go directly to Phase 5.

## Phase 5: Verify Exit Criteria

Before marking the task complete:

1. Re-read the exit criteria from `requirements.md` for this task and confirm each one is satisfied.
2. Re-read the relevant design details from `design.md` and confirm the implementation conforms to the specified architecture, patterns, and constraints.
3. If any exit criteria or design constraints are not met, go back and address them.

## Phase 6: Update Tracking

1. In `tasks.md`, mark ONLY the single task you just completed (and its direct subtasks) with `[X]`. **Do NOT mark any other tasks as complete.** When editing `tasks.md`, use a surgical edit (e.g., find-and-replace on the specific task line) rather than rewriting the entire file. If you rewrite the file, you MUST preserve the exact checkbox state (`[ ]` or `[X]`) of every task you did NOT work on. Double-check the file after editing to confirm no other tasks were accidentally marked.
2. Append a progress entry to `progress.md` (see format below)
3. If you discovered a reusable codebase pattern, add it to the Codebase Patterns section in `progress.md`
4. Final sweep: if you hit ANY error during this task that you haven't already added to Corrections, add it now. If you followed Phase 4 step 4b faithfully, this step should be a no-op.

## Progress Entry Format

Append to the bottom of `progress.md`:

```
## [Date] - [Task ID]: [Brief description]
- What was implemented
- Files changed
- Tools used (list any non-default tools you chose to use and why, e.g., "Used MCP linter to validate schema — caught a missing required field")
- Corrections added (list here; must already exist in the Corrections section — if not, add them there now)
---
```

Note: The Corrections and Codebase Patterns sections at the top of the file are the canonical reference. Progress entries provide a chronological record and should cross-reference what was added to those sections, not replace them.

## Corrections

Maintain a `# Corrections` section at the VERY TOP of `progress.md`, above Codebase Patterns. This is a flat lookup table of mistakes that have already been made and their fixes. Every iteration must read this section before doing any work, and must never repeat a listed mistake.

Each entry follows this format — short, scannable, no prose:

```
- ❌ `python manage.py migrate` → ✅ `python3 manage.py migrate` (system has no `python` alias)
- ❌ `import { foo } from 'lib'` → ✅ `import { foo } from 'lib/index.js'` (ESM requires explicit extensions)
- ❌ Creating migration without IF NOT EXISTS → ✅ Always use IF NOT EXISTS (prevents re-run failures)
- ❌ Running tests with `npm test` → ✅ `npm run test:unit` (project uses separate test scripts)
- ❌ UNRESOLVED: [description of issue that couldn't be fixed after 3 attempts]
```

**When to write a correction:** Any time you encounter an error, a failed command, a wrong assumption, or a workaround — anything where your first attempt was wrong and you had to adjust. Write it immediately when it happens, not at the end of the task.

**What makes a good correction:**
- Wrong CLI command or binary name
- Missing flags, env vars, or config needed for a command to work
- Import path or module resolution issues
- API or library usage that differs from what you assumed
- File paths or naming conventions you got wrong
- Build/test/lint commands that need specific arguments
- Platform-specific gotchas (OS, runtime version, etc.)
- Any assumption that turned out to be false

## Stop Condition

After completing your one task, check if ALL tasks in `tasks.md` are marked `[X]`.

If all tasks are complete:

1. Reply with:
   ```
   <promise>COMPLETE</promise>
   ```

If tasks remain, end normally after completing your one task.