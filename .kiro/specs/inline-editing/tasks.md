# Implementation Plan: Inline Editing

## Overview

Replace modal/popup-based creation and editing with inline Excel-style editing directly within table rows for Items, Instock, and Outstock entities. Implementation proceeds bottom-up: utility functions first, then context/state management, then UI components, then wiring and cleanup.

## Tasks

- [X] 1. Create utility modules and types
  - [X] 1.1 Create FieldMapper utility (`src/util/fieldMapper.ts`)
    - Implement `mapFieldTypeToControl(fieldType: string): InputControlType` mapping AutoField→hidden, IntegerField→number, DecimalField→decimal, DateField→date, ChoiceField→select, ForeignKey→autocomplete, all others→text
    - Implement `getEditableFields(modalInputs: FieldsDataType): FieldsDataType` filtering out AutoField entries
    - Export `InputControlType` type
    - _Requirements: 1.1, 1.2, 2.2_

  - [X] 1.2 Write property test for FieldMapper
    - **Property 1: Field schema to editable controls mapping**
    - **Validates: Requirements 1.1, 1.2, 2.2**
    - Create `src/util/__tests__/fieldMapper.property.test.ts`
    - Generate random `FieldsDataType` arrays with mixed field types using fast-check
    - Assert AutoField entries are excluded and each remaining entry maps to correct InputControlType

  - [X] 1.3 Create Validation utility (`src/util/validation.ts`)
    - Implement `validateRow(rowData: DataType, modalInputs: FieldsDataType): ValidationResult` checking required fields non-empty, numeric fields valid
    - Implement `formatValidationError(fieldName: string, reason: string): string` returning human-readable messages
    - Implement `mapServerErrors(serverResponse: Record<string, string[]>): ValidationErrors` converting DRF error format
    - Export `ValidationResult` and `ValidationErrors` types
    - _Requirements: 2.7, 3.1, 3.2, 3.3, 3.4, 4.4, 4.5_

  - [X] 1.4 Write property tests for Validation utility
    - **Property 3: Client-side validation correctly identifies invalid fields**
    - **Property 4: Server error response mapping**
    - **Validates: Requirements 2.7, 3.1, 3.2, 4.4, 1.5, 2.8, 3.3, 3.4, 4.5**
    - Create `src/util/__tests__/validation.property.test.ts`
    - Generate random schemas + row data with empty/filled fields; assert `validateRow` returns correct errors
    - Generate random DRF error objects; assert `mapServerErrors` maps all fields correctly

  - [X] 1.5 Create Keyboard Navigation utility (`src/util/keyboardNavigation.ts`)
    - Implement `getNavigationAction(event: React.KeyboardEvent, currentIndex: number, totalFields: number): NavigationAction`
    - Tab on non-last→next, Tab on last→none, Shift+Tab on non-first→previous, Shift+Tab on first→none, Enter on last→save, Enter on non-last→next, Escape→cancel
    - Export `NavigationAction` type
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [X] 1.6 Write property test for Keyboard Navigation
    - **Property 5: Keyboard navigation focus management**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7**
    - Create `src/util/__tests__/keyboardNavigation.property.test.ts`
    - Generate random field counts (1-20), random focus positions, random key events
    - Assert correct NavigationAction returned for all combinations

  - [X] 1.7 Create MoveToOutstock utility (`src/util/moveToOutstock.ts`)
    - Define `OUTSTOCK_COPY_FIELDS = ['item', 'quantity', 'stock_date', 'notes', 'store_type', 'job']`
    - Implement `extractOutstockFields(instockData: DataType): DataType` returning only copy fields
    - _Requirements: 7.2, 7.3_

  - [X] 1.8 Write property test for MoveToOutstock
    - **Property 6: Move-to-outstock field extraction**
    - **Validates: Requirements 7.2**
    - Create `src/util/__tests__/moveToOutstock.property.test.ts`
    - Generate random instock DataType objects with varying field sets
    - Assert only OUTSTOCK_COPY_FIELDS keys present in result, values match source

- [X] 2. Checkpoint - Ensure all utility tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [X] 3. Create InlineEditingContext
  - [X] 3.1 Create InlineEditingContext provider (`src/pages/context/InlineEditingContext.tsx`)
    - Define `EditMode`, `ValidationErrors`, `InlineEditingContextType` types
    - Implement context provider with state: `editMode`, `editingRowId`, `editingData`, `validationErrors`, `isSaving`
    - Implement `startEditing(rowData)`: set editMode='editing', store rowData and row id
    - Implement `startCreating()`: set editMode='creating', initialize empty editingData
    - Implement `updateField(fieldName, value)`: update editingData and call `clearFieldError`
    - Implement `clearFieldError(fieldName)`: remove specific field from validationErrors
    - Implement `cancel()`: reset all state to defaults
    - Implement `save(pageName, modalInputs)`: run validateRow, if invalid set errors and return; if valid POST (creating) or PUT (editing) via Requests utility, handle success (reset state, trigger refetch) and error (set validationErrors from server response)
    - Implement `moveToOutstock(rowData, changePageTo)`: call extractOutstockFields, navigate to outstock page, start creating with pre-filled data
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 1.7, 2.1, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 4.1, 4.2, 4.3, 4.5, 4.6, 4.7, 7.1, 7.2, 7.3_

  - [X] 3.2 Write property test for edit-cancel round trip
    - **Property 2: Edit-cancel round trip preserves original data**
    - **Validates: Requirements 2.1, 2.4**
    - Create `src/pages/context/__tests__/inlineEditing.property.test.ts`
    - Generate random DataType objects, simulate startEditing + arbitrary field modifications + cancel
    - Assert state returns to original data after cancel

- [ ] 4. Create UI components
  - [ ] 4.1 Create EditableCell component (`src/pages/table/EditableCell.tsx`)
    - Render appropriate input control based on fieldType using FieldMapper
    - Text input for text, number input for numeric, date picker for date, select for choices, autocomplete for ForeignKey
    - Apply red border class when `error` prop is present
    - Show tooltip with error message on hover/focus when error present
    - Clear error on value change via onChange callback
    - Forward ref for focus management
    - Handle onKeyDown for keyboard navigation
    - _Requirements: 1.2, 2.2, 3.1, 3.2, 3.3, 3.4, 3.5, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [ ] 4.2 Create EditableRow component (`src/pages/table/EditableRow.tsx`)
    - Accept `modalInputs`, `currentPageName`, `isNewRow` props
    - Use InlineEditingContext to get editingData, validationErrors, updateField, save, cancel
    - Render EditableCell for each editable field (from getEditableFields)
    - Render Save and Cancel action buttons
    - Render "Move to Outstock" button when currentPageName is 'instock' and not a new row
    - Manage refs array for keyboard focus navigation between cells
    - Implement keyboard navigation using getNavigationAction utility
    - _Requirements: 1.2, 1.3, 2.2, 2.3, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 7.1_

  - [ ] 4.3 Write unit tests for EditableRow
    - Create `src/pages/table/__tests__/EditableRow.test.tsx`
    - Test Save/Cancel buttons rendered in edit mode
    - Test "Move to Outstock" button only shown for instock pages
    - Test Escape key triggers cancel
    - _Requirements: 1.3, 2.3, 5.3, 7.1_

- [ ] 5. Integrate inline editing into Table
  - [ ] 5.1 Modify Table component (`src/pages/table/Table.tsx`)
    - Wrap table with InlineEditingContext provider (or consume from parent)
    - Conditionally render New_Row (EditableRow with isNewRow=true) at top of table when editMode='creating'
    - For each data row: if row id matches editingRowId, render EditableRow; otherwise render existing display row
    - Add click handler on display rows to call startEditing with row data
    - Prevent row click from triggering edit when another row is already in edit mode (Requirement 2.5)
    - _Requirements: 1.1, 2.1, 2.5, 6.1, 6.2, 6.3, 6.4_

  - [ ] 5.2 Modify TableToolbar (`src/pages/table/TableToolbar.tsx`)
    - Replace popup open call with `startCreating()` from InlineEditingContext
    - Disable Create button when `editMode === 'creating'`
    - _Requirements: 1.1, 1.7_

  - [ ] 5.3 Wire InlineEditingContext into App component
    - Add InlineEditingContext provider wrapping the table page components in App.tsx or appropriate parent
    - Connect page refetch logic: after successful save of New_Row, trigger page data re-fetch from PageChanger context
    - _Requirements: 4.3, 4.6_

- [ ] 6. Checkpoint - Ensure inline editing works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Remove popup/modal system for entity editing
  - [ ] 7.1 Remove popup triggers from Items, Instock, Outstock pages
    - Remove calls to `openPopup` / `PopupContextManager` for create/edit operations on these entity pages
    - Remove popup-related props passed to table components for these entities
    - Ensure no dialog/modal/overlay elements rendered during create/edit
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ] 7.2 Clean up unused popup code
    - Remove or deprecate popup components (`Popups.tsx`, `Forms.tsx`) if no longer used by any page
    - Remove `PopupContextManager` if fully replaced (check if other non-entity pages still use it)
    - Remove unused CSS/styles related to popup forms
    - _Requirements: 6.3_

- [ ] 8. Implement Move to Outstock flow
  - [ ] 8.1 Implement Move to Outstock action in EditableRow
    - Wire "Move to Outstock" button to call `moveToOutstock` from InlineEditingContext
    - Navigate to outstock page using PageChanger context's changePageTo
    - Open New_Row on outstock page pre-filled with extracted fields from instock record
    - Ensure original instock record is not modified or deleted
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ] 8.2 Write unit test for Move to Outstock flow
    - Test navigation occurs to outstock page
    - Test pre-filled fields match source instock record
    - Test original instock record unchanged
    - _Requirements: 7.2, 7.3_

- [ ] 9. Backend validation for outstock quantity
  - [ ] 9.1 Verify/add backend validation for outstock quantity exceeding item quantity
    - Ensure outstock serializer/view validates that quantity does not exceed available item quantity
    - Return 400 with field-level error message when quantity exceeds available stock
    - Frontend displays this as a Validation_Indicator on the quantity field
    - _Requirements: 7.4_

  - [ ] 9.2 Write backend property test for outstock quantity validation
    - Create test in `stockmanagement/tests/test_inline_editing_api.py`
    - Use Hypothesis to generate random quantities above item threshold
    - Assert API returns 400 and quantity field in error response
    - _Requirements: 7.4_

- [ ] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Existing `Requests` utility class used for all API calls (no new HTTP dependencies)
- Tailwind CSS + HTML elements preferred over MUI components per design decision
- Frontend uses TypeScript, backend uses Python (Django REST Framework)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.3", "1.5", "1.7"] },
    { "id": 1, "tasks": ["1.2", "1.4", "1.6", "1.8"] },
    { "id": 2, "tasks": ["3.1"] },
    { "id": 3, "tasks": ["3.2", "4.1"] },
    { "id": 4, "tasks": ["4.2"] },
    { "id": 5, "tasks": ["4.3", "5.1", "5.2"] },
    { "id": 6, "tasks": ["5.3", "7.1"] },
    { "id": 7, "tasks": ["7.2", "8.1", "9.1"] },
    { "id": 8, "tasks": ["8.2", "9.2"] }
  ]
}
```
