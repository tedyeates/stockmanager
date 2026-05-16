# Requirements Document

## Introduction

Refactor the PC Elemac Stock Manager to replace modal/popup-based creation and editing with inline Excel-style editing directly within table rows. Users will create new records by adding a blank editable row to the table, edit existing records by clicking into cells, and receive immediate visual validation feedback (red-highlighted cells with error tooltips) when required fields are missing or invalid. This applies to all editable entity tables: Items, Instock, and Outstock.

## Glossary

- **Inline_Editor**: The table component that renders editable cells directly within table rows, replacing the popup/modal form system
- **Editable_Row**: A table row in edit mode where cells contain input controls matching the field type (text, number, date, select, autocomplete)
- **New_Row**: A blank Editable_Row appended to the table for creating a new record
- **Validation_Indicator**: A visual treatment applied to an editable cell consisting of a red border highlight and an error message tooltip
- **Cell**: An individual data field within a table row that can transition between display mode and edit mode
- **Required_Field**: A field that must contain a valid value before the record can be persisted to the backend
- **Field_Schema**: The metadata describing a field's name, type, choices, and validation constraints as returned by the `/fields/{pageName}` endpoint
- **Save_Action**: The user-initiated action that triggers validation and, if valid, persists the row data to the backend API
- **Cancel_Action**: The user-initiated action that discards unsaved changes and reverts the row to display mode or removes a New_Row
- **Display_Mode**: The default non-editable rendering of a table cell showing formatted data
- **Edit_Mode**: The state of a row where cells render as input controls allowing modification

## Requirements

### Requirement 1: Inline Row Creation

**User Story:** As a stock manager, I want to add a new blank row directly in the table, so that I can enter new record data without a popup interrupting my workflow.

#### Acceptance Criteria

1. WHEN the user clicks the "Create" button, THE Inline_Editor SHALL append a New_Row at the top of the table with empty editable input controls for each visible field defined in the Field_Schema, excluding AutoField (ID) fields
2. WHILE a New_Row is present, THE Inline_Editor SHALL render input controls matching each field's type: text input for text fields, number input for DecimalField and IntegerField, date picker for DateField, select/autocomplete for ForeignKey fields, and dropdown select for ChoiceField
3. WHILE a New_Row is present, THE Inline_Editor SHALL display a "Save" action control and a "Cancel" action control within the row
4. WHEN the user triggers the Save_Action on a New_Row, THE Inline_Editor SHALL submit the row data to the API and, on success, remove the New_Row and display the persisted record in the table
5. IF the API returns a validation or server error after the user triggers the Save_Action, THEN THE Inline_Editor SHALL display an error indication identifying the failed field(s) and preserve the entered data in the New_Row so the user can correct and retry
6. WHEN the user triggers the Cancel_Action on a New_Row, THE Inline_Editor SHALL remove the New_Row from the table without persisting any data and discard all entered field values
7. WHILE a New_Row is present, THE Inline_Editor SHALL disable the "Create" button to prevent multiple simultaneous New_Rows

### Requirement 2: Inline Row Editing

**User Story:** As a stock manager, I want to edit existing records directly in the table row, so that I can quickly update data without opening a separate form.

#### Acceptance Criteria

1. WHEN the user clicks on an existing table row that is in Display_Mode, THE Inline_Editor SHALL transition that row from Display_Mode to Edit_Mode with input controls pre-filled with the current field values
2. WHILE a row is in Edit_Mode, THE Inline_Editor SHALL render input controls matching each field's type as defined in the Field_Schema (text input for text fields, number input for numeric fields, date picker for date fields, select dropdown for choice fields, and autocomplete for foreign key fields)
3. WHILE a row is in Edit_Mode, THE Inline_Editor SHALL display a "Save" action control and a "Cancel" action control within the row
4. WHEN the user triggers the Cancel_Action on an Edit_Mode row, THE Inline_Editor SHALL revert the row to Display_Mode with the original data values without sending a request to the server
5. WHILE one row is in Edit_Mode, IF the user clicks on a different row, THEN THE Inline_Editor SHALL keep the current row in Edit_Mode and not transition the clicked row to Edit_Mode
6. WHEN the user triggers the Save_Action on an Edit_Mode row, THE Inline_Editor SHALL validate all edited fields against the Field_Schema constraints and, if all fields are valid, send the updated record to the server and transition the row back to Display_Mode showing the saved values within 2 seconds of server confirmation
7. IF field validation fails when the user triggers the Save_Action, THEN THE Inline_Editor SHALL keep the row in Edit_Mode, display an error indication adjacent to each invalid field identifying the validation failure reason, and not send a request to the server
8. IF the server returns an error response after the Save_Action is triggered, THEN THE Inline_Editor SHALL keep the row in Edit_Mode, display an error indication with the server-provided failure reason, and preserve the user's edited values in the input controls

### Requirement 3: Field Validation with Visual Feedback

**User Story:** As a stock manager, I want to see which fields have errors highlighted in red with a tooltip message, so that I can quickly identify and fix validation problems.

#### Acceptance Criteria

1. WHEN the user triggers the Save_Action and a Required_Field is empty, THE Validation_Indicator SHALL apply a red border to the Cell containing the empty Required_Field
2. WHEN the user triggers the Save_Action and a Required_Field is empty, THE Validation_Indicator SHALL display a tooltip on the highlighted Cell that identifies the field name and states it is required, visible when the user hovers over or focuses the Cell
3. WHEN the user triggers the Save_Action and the backend returns field-level validation errors, THE Validation_Indicator SHALL apply a red border to each Cell corresponding to an errored field
4. WHEN the user triggers the Save_Action and the backend returns field-level validation errors, THE Validation_Indicator SHALL display a tooltip on each highlighted Cell containing the backend error message, visible when the user hovers over or focuses the Cell
5. WHEN the user modifies the value of a Cell that has a Validation_Indicator, THE Inline_Editor SHALL remove the Validation_Indicator from that Cell
6. WHEN the user triggers the Save_Action on a row that already has Validation_Indicators, THE Inline_Editor SHALL clear all existing Validation_Indicators on that row before re-evaluating validation and applying new Validation_Indicators for any fields that are still invalid

### Requirement 4: Save Behavior and Persistence

**User Story:** As a stock manager, I want the system to only save my row when all required fields are filled correctly, so that incomplete records are never stored.

#### Acceptance Criteria

1. WHEN the user triggers the Save_Action and all Required_Fields pass client-side validation, THE Inline_Editor SHALL send a POST request to the backend API for a New_Row that has no existing record identifier
2. WHEN the user triggers the Save_Action and all Required_Fields pass client-side validation, THE Inline_Editor SHALL send a PUT request to the backend API for a row in Edit_Mode that has an existing record identifier
3. WHEN the backend API returns a successful response, THE Inline_Editor SHALL transition the row to Display_Mode and render the field values returned in the API response body
4. WHEN the user triggers the Save_Action and any Required_Field is empty or fails its field-type validation rule, THE Inline_Editor SHALL prevent the API request from being sent and display Validation_Indicators on each failing field
5. IF the backend API returns a validation error response, THEN THE Inline_Editor SHALL keep the row in Edit_Mode, preserve the user's entered data, and display the returned field-level errors using Validation_Indicators adjacent to the corresponding fields
6. WHEN the backend API returns a successful response for a New_Row, THE Inline_Editor SHALL re-fetch the current page of table data from the backend API to reflect the newly created record and current pagination state
7. IF the backend API request fails due to a network error or non-validation error response, THEN THE Inline_Editor SHALL keep the row in Edit_Mode, preserve the user's entered data, and display an error message indicating the save operation failed

### Requirement 5: Keyboard Navigation

**User Story:** As a stock manager, I want to navigate between editable cells using keyboard shortcuts, so that I can enter data efficiently like in a spreadsheet.

#### Acceptance Criteria

1. WHEN the user presses the Tab key while editing a Cell that is not the last editable Cell in the row, THE Inline_Editor SHALL move focus to the next editable Cell in left-to-right order within the same row
2. WHEN the user presses Shift+Tab while editing a Cell that is not the first editable Cell in the row, THE Inline_Editor SHALL move focus to the previous editable Cell in left-to-right order within the same row
3. WHEN the user presses the Escape key while a row is in Edit_Mode, THE Inline_Editor SHALL trigger the Cancel_Action for that row
4. WHEN the user presses Enter while editing the last editable Cell in a row, THE Inline_Editor SHALL trigger the Save_Action for that row
5. WHEN the user presses the Tab key while editing the last editable Cell in the row, THE Inline_Editor SHALL keep focus on the last editable Cell without moving focus outside the row
6. WHEN the user presses Shift+Tab while editing the first editable Cell in the row, THE Inline_Editor SHALL keep focus on the first editable Cell without moving focus outside the row
7. WHEN the user presses Enter while editing a Cell that is not the last editable Cell in the row, THE Inline_Editor SHALL move focus to the next editable Cell in left-to-right order within the same row

### Requirement 6: Removal of Popup/Modal System

**User Story:** As a stock manager, I want all creation and editing to happen inline, so that the interface is consistent and I never see a popup form for these operations.

#### Acceptance Criteria

1. WHEN the user initiates record creation for Items, Instock, or Outstock, THE Inline_Editor SHALL display the creation form within the current page layout without opening a modal or dialog
2. WHEN the user selects an existing record for editing on Items, Instock, or Outstock pages, THE Inline_Editor SHALL display the editing form within the current page layout without opening a modal or dialog
3. WHILE the current page is an entity that supports inline editing (Items, Instock, Outstock), THE Inline_Editor SHALL not render any element with a dialog role, overlay backdrop, or popup container in the DOM during record creation or editing operations
4. WHEN the user initiates record creation or editing for Items, Instock, or Outstock, THE Inline_Editor SHALL not obscure or disable interaction with the underlying table content via overlays or focus traps

### Requirement 7: Move to Outstock Inline Action

**User Story:** As a stock manager, I want to move an instock record to outstock directly from the inline editor, so that I can quickly transfer stock without extra navigation.

#### Acceptance Criteria

1. WHILE an Instock row is in Edit_Mode, THE Inline_Editor SHALL display a "Move to Outstock" action button
2. WHEN the user triggers the "Move to Outstock" action, THE Inline_Editor SHALL navigate to the Outstock table and open a New_Row in Edit_Mode pre-filled with the following fields copied from the Instock record: item, quantity, stock_date, notes, store_type, and job
3. WHEN the user triggers the "Move to Outstock" action, THE Inline_Editor SHALL retain the original Instock record unchanged, this is important historical data. No deletion should occur, this is a copy style action
4. IF the pre-filled quantity exceeds the available item quantity when the user attempts to save the new Outstock row, THEN THE System SHALL display an error message indicating insufficient stock and prevent the save, returning to the Instock page
