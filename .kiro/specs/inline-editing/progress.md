# Corrections

- ❌ Using `fc.string().filter(s => /^[a-z_]+$/.test(s))` for field names → ✅ Use `/^[a-z][a-z_]*$/` to exclude `__proto__` and other dunder names that break `hasOwnProperty` checks in property tests

# Codebase Patterns

- **Property test pattern**: Use `fc.assert(fc.property(...), { numRuns: 100 })` with vitest `describe/it`. Tag with `// Feature: inline-editing, Property N: title`
- **Import aliases**: `util/...`, `pages/...`, `styles/...` resolve to `src/util/`, `src/pages/`, `src/styles/` (configured in vitest.config.ts and tsconfig.json)
- **Test file location**: `src/<module>/__tests__/<name>.property.test.ts` for property tests
- **Type imports**: Domain types from `util/types/PageTypes` (PageName, DataType, FieldsDataType, etc.)

---

## 2026-05-16 - Task 1: Create utility modules and types
- Implemented: fieldMapper.ts, validation.ts, keyboardNavigation.ts, moveToOutstock.ts
- Property tests: fieldMapper.property.test.ts, validation.property.test.ts, keyboardNavigation.property.test.ts, moveToOutstock.property.test.ts
- Files changed: 8 new files in src/util/ and src/util/__tests__/
- Tools used: vitest (run tests), tsc --noEmit (typecheck)
- Corrections added: __proto__ field name filter
---

## 2026-05-16 - Task 2: Checkpoint - Ensure all utility tests pass
- Verified: all 33 tests pass (7 test files), tsc --noEmit clean
- Inline-editing property tests confirmed passing: fieldMapper (3), validation (2), keyboardNavigation (1), moveToOutstock (1)
- Files changed: none
- Tools used: vitest run, tsc --noEmit
- Corrections added: none
---

## 2026-05-16 - Task 3: Create InlineEditingContext
- Implemented: InlineEditingContext provider with full state management (editMode, editingRowId, editingData, validationErrors, isSaving) and actions (startEditing, startCreating, updateField, clearFieldError, save, cancel, moveToOutstock)
- Modified Requests utility to expose `RequestError` class with status and responseData for field-level error handling on 400 responses
- Added `refreshPage` function to PageChanger context (uses counter to trigger useEffect refetch)
- Property test: edit-cancel round trip verifies cancel resets state and original data is never mutated
- Files changed:
  - `src/pages/context/InlineEditingContext.tsx` (new)
  - `src/pages/context/__tests__/inlineEditing.property.test.ts` (new)
  - `src/pages/context/PageChanger.tsx` (added refreshPage, refreshCounter)
  - `src/util/requests.tsx` (added RequestError class, removed console.logs, parse response body on error)
- Tools used: tsc --noEmit (typecheck), vitest run (tests)
- Corrections added: none
---

## 2026-05-16 - Task 4: Create UI components
- Implemented: EditableCell.tsx (renders input per field type with error tooltip), EditableRow.tsx (orchestrates cells, buttons, keyboard nav)
- Unit tests: EditableRow.test.tsx — Save/Cancel rendered, Move to Outstock conditional, Escape triggers cancel, AutoField excluded
- Files changed:
  - `src/pages/table/EditableCell.tsx` (new)
  - `src/pages/table/EditableRow.tsx` (new)
  - `src/pages/table/__tests__/EditableRow.test.tsx` (new)
- Tools used: tsc --noEmit (typecheck), vitest --run (all 45 tests pass across 9 files)
- Corrections added: none
---

## 2026-05-16 - Task 5: Integrate inline editing into Table
- Implemented: Table renders EditableRow for creating (top of tbody) and editing (matching row id), click handler triggers startEditing with guard against multiple edits. TableToolbar uses startCreating() with disabled state. InlineEditingProvider wraps Table+Toolbar in App.tsx.
- Files changed:
  - `src/pages/table/Table.tsx` (replaced popup import with InlineEditingContext, added EditableRow rendering, new click handler with edit guard)
  - `src/pages/table/TableToolbar.tsx` (replaced PopupContextManager with InlineEditingContext, disabled Create button when creating)
  - `src/pages/App.tsx` (added InlineEditingProvider wrapping table area, passed modalInputs to Table)
  - `src/pages/ExpandButton.tsx` (added disabled prop)
- Tools used: tsc --noEmit (typecheck), vitest --run (all 45 tests pass)
- Corrections added: none
---
