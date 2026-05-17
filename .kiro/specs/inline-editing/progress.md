# Corrections

- ❌ Using `fc.string().filter(s => /^[a-z_]+$/.test(s))` for field names → ✅ Use `/^[a-z][a-z_]*$/` to exclude `__proto__` and other dunder names that break `hasOwnProperty` checks in property tests
- ❌ `store_type` value `"METAL"` in test data → ✅ Use lowercase `"metal"` (StoreType.METAL = "metal")
- ❌ Using `User.objects.create_user()` in Hypothesis TestCase setUp → ✅ Use `get_or_create` to avoid UniqueViolation across test methods (Hypothesis TestCase doesn't flush between methods like TransactionTestCase)
- ❌ Assuming Django `ValidationError` raised in model layer returns 400 via DRF → ✅ DRF only catches `rest_framework.exceptions.ValidationError`; must catch `django.core.exceptions.ValidationError` in ViewSet and re-raise as DRF's

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

## 2026-05-16 - Task 6: Checkpoint - Ensure inline editing works end-to-end
- Verified: all 45 tests pass (9 test files), tsc --noEmit clean
- No errors or issues found
- Files changed: none
- Tools used: vitest run, tsc --noEmit
- Corrections added: none
---

## 2026-05-16 - Task 7: Remove popup/modal system for entity editing
- Removed `Popup` component and `PopupProvider` wrapper from App.tsx
- Deleted `Popups.tsx`, `Forms.tsx`, `PopupContextManager.tsx` (all fully replaced by inline editing)
- Kept `Errors.tsx` — still used by Login.tsx
- Kept `forms.css` — `form-dropdown` class still used by ModelAutocomplete; added import to ModelAutocomplete.tsx
- Files changed:
  - `src/pages/App.tsx` (removed Popup/PopupProvider imports and usage)
  - `src/pages/popup/Popups.tsx` (deleted)
  - `src/pages/popup/Forms.tsx` (deleted)
  - `src/pages/context/PopupContextManager.tsx` (deleted)
  - `src/pages/table/ModelAutocomplete.tsx` (added forms.css import)
- Tools used: tsc --noEmit (typecheck), vitest --run (all 45 tests pass)
- Corrections added: none
---

## 2026-05-16 - Task 8: Implement Move to Outstock flow
- Verified existing implementation in InlineEditingContext.moveToOutstock (extractOutstockFields → changePageTo('outstock') → startCreating(prefill)) and EditableRow button wiring
- Created unit test `src/pages/context/__tests__/moveToOutstock.test.ts` covering: prefill field extraction, excluded fields, sparse records, no mutation of source, navigation call, and startCreating called with correct prefill after setTimeout
- Files changed:
  - `src/pages/context/__tests__/moveToOutstock.test.ts` (new — 6 tests)
- Tools used: vitest run (tests), tsc --noEmit (typecheck)
- Corrections added: none
---

## 2026-05-16 - Task 9: Backend validation for outstock quantity
- What was implemented:
  - Fixed OutstockViewSet.create() and update() to catch `django.core.exceptions.ValidationError` from OutstockManager and re-raise as DRF's `ValidationError` — previously would have returned 500 instead of 400
  - Created property-based test (`test_inline_editing_api.py`) with Hypothesis generating random excess quantities, verifying 400 + `quantity` field in error response
  - Added sanity tests: valid quantity returns 201, zero quantity returns 400
- Files changed:
  - `stockmanagement_bg/stockmanagement/views.py` (added DjangoValidationError import, try/except in create+update)
  - `stockmanagement_bg/stockmanagement/tests/test_inline_editing_api.py` (new — 3 tests including 1 property test with 100 examples)
- Tools used: pytest (backend tests)
- Corrections added: store_type lowercase value, get_or_create for Hypothesis TestCase, Django vs DRF ValidationError distinction
---

## 2026-05-16 - Task 10: Final checkpoint - Ensure all tests pass
- Verified: Frontend 51 tests pass (10 test files), tsc --noEmit clean
- Verified: Backend inline-editing tests 3/3 pass
- Pre-existing failures: 9 tests in `test_search_properties.py` and `test_search_unit.py` fail due to stale references to removed `Item.name` field and outdated `search_fields` expectations — these are from a prior feature (search) and unrelated to inline editing
- Files changed: none
- Tools used: vitest run, tsc --noEmit, pytest
- Corrections added: none
---
