# Workflows

## 1. Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant LoginPage as Login Page
    participant API as POST /login/
    participant Session as sessionStorage
    
    User->>LoginPage: Enter username + password
    LoginPage->>API: POST {username, password}
    alt Valid credentials
        API-->>LoginPage: {token, username}
        LoginPage->>Session: Store token
        LoginPage->>LoginPage: Generate auth header
        LoginPage->>User: Redirect to saved path (or "/")
    else Invalid credentials
        API-->>LoginPage: 400 {non_field_errors: [...]}
        LoginPage->>User: Display error messages
    end
```

**Key details:**
- Token stored in `sessionStorage` (cleared on tab close)
- `RequireAuth` component guards all routes — redirects to `/login` if no token
- Auth header constructed as `{Authorization: "Token <token>"}` via `useRef` (avoids re-renders)
- `clearToken()` removes from storage and forces page reload

---

## 2. Page Navigation + Data Loading

```mermaid
sequenceDiagram
    participant User
    participant Navbar
    participant PageChanger as PageChanger Context
    participant API as GET /api/{page}/
    participant FieldsAPI as GET /fields/{page}
    
    User->>Navbar: Click tab (e.g., "instock")
    Navbar->>PageChanger: changePageTo("instock")
    PageChanger->>PageChanger: Reset search, page=1, loading=true
    
    par Fetch data
        PageChanger->>API: GET /api/instock/?page=1
        API-->>PageChanger: {count, results, next, previous}
    and Fetch field metadata
        PageChanger->>FieldsAPI: GET /fields/instock
        FieldsAPI-->>PageChanger: [{fieldName, fieldType, fieldChoices, required}]
    end
    
    PageChanger->>PageChanger: Update pageData, pagination display, modalInputs
    PageChanger->>User: Render table
```

**State managed by `PageTypeChangerProvider`:**
- `currentPageName` — which resource is shown
- `pageData` — current page results array
- `modalInputs` — field metadata for current page
- `searchTerm` — current search filter
- `currentPageNumber` — pagination state
- `pageDisplay` — page number buttons, hasNext/hasPrevious

---

## 3. Search Flow

```mermaid
sequenceDiagram
    participant User
    participant Search as Search Component
    participant PageChanger as PageChanger Context
    participant API as GET /api/{page}/
    
    User->>Search: Type search term
    Search->>PageChanger: updateSearchTerm(term)
    PageChanger->>PageChanger: Reset to page 1, loading=true
    PageChanger->>API: GET /api/instock/?page=1&search={term}
    API-->>PageChanger: Filtered results
    PageChanger->>User: Render filtered table
```

**Backend behavior:**
- DRF `SearchFilter` performs case-insensitive `icontains` across configured `search_fields`
- Related fields searched via `__` lookups (e.g., `item__code`, `group__name`)
- Combined with `DjangoFilterBackend` for numeric/date range filters

---

## 4. Inline Editing Flow

```mermaid
sequenceDiagram
    participant User
    participant Table
    participant IE as InlineEditing Context
    participant Validation as validation.ts
    participant API as PUT /api/{page}/{id}/
    
    User->>Table: Click data row
    Table->>IE: startEditing(rowData)
    IE->>IE: Set editMode='editing', copy rowData
    Table->>User: Render EditableRow (cells become inputs)
    
    User->>Table: Modify field values
    Table->>IE: updateField(fieldName, value)
    
    User->>Table: Click Save
    IE->>Validation: validateRow(editingData, modalInputs)
    alt Client validation fails
        Validation-->>IE: {errors}
        IE->>User: Show field-level errors
    else Client validation passes
        IE->>IE: Transform M2M/FK objects → IDs
        IE->>API: PUT /api/instock/{id}/ (JSON payload)
        alt Server accepts
            API-->>IE: Updated record
            IE->>IE: resetState()
            IE->>Table: refreshPage() → re-fetch data
        else Server rejects (400)
            API-->>IE: {field: [errors]}
            IE->>IE: mapServerErrors() → validationErrors
            IE->>User: Show server validation errors
        end
    end
```

---

## 5. Inline Creation Flow

```mermaid
sequenceDiagram
    participant User
    participant Toolbar as TableToolbar
    participant IE as InlineEditing Context
    participant Table
    participant API as POST /api/{page}/
    
    User->>Toolbar: Click "Create" button
    Toolbar->>IE: startCreating()
    IE->>IE: Set editMode='creating', empty editingData
    Table->>User: Render new EditableRow at top of table
    
    User->>Table: Fill in fields
    User->>Table: Click Save
    IE->>API: POST /api/instock/ (JSON payload)
    alt Success
        API-->>IE: Created record (201)
        IE->>IE: resetState()
        IE->>Table: refreshPage()
    else Validation error
        API-->>IE: 400 {field: [errors]}
        IE->>User: Show errors on fields
    end
```

---

## 6. Instock Creation (Backend Business Logic)

```mermaid
flowchart TD
    A[POST /api/instock/] --> B[FormDataMixin.create]
    B --> C[related_object_to_id - resolve item/job IDs]
    C --> D[Serializer validates]
    D --> E[super.create - save Instock record]
    E --> F[get_connected_item - load Item]
    F --> G[update_instock_item]
    G --> G1[item.instock_number += 1]
    G --> G2[item.sum_price += price × quantity]
    G --> G3[item.max_price = max of new vs current]
    G --> G4[item.min_price = min of new vs current]
    F --> H[update_item_quantity]
    H --> H1[item.quantity += instock.quantity]
    H1 --> I[item.save]
```

---

## 7. Outstock Creation (Backend Business Logic)

```mermaid
flowchart TD
    A[POST /api/outstock/] --> B[OutstockViewSet.create]
    B --> C[Serializer validates data]
    C --> D[OutstockManager.create_outstock]
    D --> E{validate_quantity}
    E -->|quantity <= 0| F[Raise ValidationError]
    E -->|quantity > item.quantity| F
    E -->|Valid| G[update_outstock_number]
    G --> H[update_quantity - subtract from item]
    H --> I[Set remaining_quantity snapshot]
    I --> J[Outstock.objects.create]
    J --> K[Set M2M jobs]
    K --> L[item.save]
    L --> M[Return outstock instance]
```

**Critical constraint**: All inside `@transaction.atomic` — if any step fails, everything rolls back.

---

## 8. Move to Outstock (Instock → Outstock Shortcut)

```mermaid
sequenceDiagram
    participant User
    participant IE as InlineEditing
    participant PageChanger
    
    User->>IE: Click "Move to Outstock" on instock row
    IE->>IE: extractOutstockFields(rowData)
    Note over IE: Extracts item, quantity, job, store_type, notes
    IE->>IE: resetState()
    IE->>PageChanger: changePageTo('outstock')
    IE->>IE: setTimeout → startCreating(prefill)
    IE->>User: Outstock page with pre-filled create row
```

---

## 9. CSV Export Flow

```mermaid
sequenceDiagram
    participant User
    participant Toolbar as TableToolbar
    participant API as GET /api/{page}/export/
    
    User->>Toolbar: Click "Export CSV"
    Toolbar->>Toolbar: Build URL with current search term
    Toolbar->>API: GET /api/instock/export/?search={term}
    API->>API: Filter queryset (same as list view)
    API->>API: Serialize with export_serializer_class
    API->>API: Write CSV rows
    API-->>Toolbar: CSV blob
    Toolbar->>User: Trigger file download (js-file-download)
```

**Export serializers** use `SlugRelatedField` for FK fields — outputs human-readable names (e.g., item code, group name) instead of IDs.

---

## 10. Instock Update (Price Recalculation)

```mermaid
flowchart TD
    A["PUT /api/instock/{id}/"] --> B[Load existing instock]
    B --> C[Check if item changed]
    C --> D[super.update - save new values]
    D --> E[reset_sum - undo old price contribution]
    E --> F[old_item.quantity -= old_quantity]
    F --> G[old_item.save]
    G --> H[get_connected_item - load new/same item]
    H --> I[reset_price - recalculate min/max from DB]
    I --> J[update_item_quantity - add new quantity]
    J --> K[update_instock_item - add new price contribution]
    K --> L[connected_item.save]
```

This handles the case where an instock record's item, quantity, or price changes — old contributions are reversed, then new ones applied.

---

## 11. Data Import (loadstock Command)

```mermaid
flowchart TD
    A[manage.py loadstock] --> B[load_stock_data]
    B --> C[open_log_file]
    C --> D[load_excel - open workbook]
    D --> E[build_caches - preload groups/brands/items]
    E --> F[load_items - process item rows]
    F --> G[flush_items - batch create items]
    G --> H[load_instock - process instock rows]
    H --> I[flush_stock_records - batch create instocks]
    I --> J[load_outstock - process outstock rows]
    J --> K[flush_stock_records - batch create outstocks]
```

Uses `openpyxl` for Excel reading. Processes in batches with progress tracking (`save_progress`/`load_progress`).


---

## 12. Delete Behavior

All CRUD ViewSets inherit `ModelViewSet.destroy()` — DELETE requests are allowed for all managed resources (Group, Item, Instock, Outstock).

### Cascade Behavior

**All foreign keys use `on_delete=models.SET_NULL`** — no cascading deletes anywhere:

| Deleted Model | Effect on Related Records |
|---------------|--------------------------|
| Item | Instock/Outstock `.item` set to NULL (records preserved) |
| Group | Item `.group` set to NULL |
| Brand | Item `.brand` set to NULL |
| Customer | Outstock `.customer` set to NULL |
| Instock | No cascade (nothing references Instock via FK) |
| Outstock | No cascade (nothing references Outstock via FK) |

### Important: No Business Logic on Delete

Deleting an Instock or Outstock record does **NOT** reverse its quantity/price effects on the parent Item. For example:
- Deleting an Instock will NOT subtract its quantity from `item.quantity` or recalculate `sum_price`/`min_price`/`max_price`
- Deleting an Outstock will NOT restore its quantity to `item.quantity`

This means deletions can create data inconsistency in Item aggregate fields. The `reset_django_tables` management command with `--backup-only` is the safest way to handle bulk corrections.

### M2M Relations

Instock and Outstock have `ManyToManyField` to Job. Django automatically cleans up the join table entries when either side is deleted — no orphan records in the M2M through table.


---

## 13. Excel Import Format Specification (`loadstock`)

Import files are placed in `stockmanagement_bg/stockmanagement/static/stockmanagement/data/`.

The system currently imports two files configured in `load_stock_data()`:

| File | Item Sheet | Instock Sheet | Outstock Sheet | Store Type | Has Group Column |
|------|-----------|---------------|----------------|------------|------------------|
| `ACC_2026.xlsx` | TABLE ITEM | Instock | Outstock | accessory | No |
| `METAL_2026.xlsx` | Tableitem | Instock | Outstock. | metal | Yes |

### Item Sheet Columns

**With group column** (METAL):

| Col | Field | Required | Notes |
|-----|-------|----------|-------|
| A (0) | code | ✓ | SKU code, uppercased. Duplicates skipped |
| B (1) | group | | Group name — auto-created if missing |
| C (2) | description | | Item description |
| D (3) | brand | | Brand name — auto-created if missing |
| E (4) | unit | | Unit of measurement |
| F (5) | max_price | | Decimal — not used for initial import (calculated from instocks) |
| G (6) | min_price | | Decimal — not used for initial import |

**Without group column** (ACC):

| Col | Field | Required | Notes |
|-----|-------|----------|-------|
| A (0) | code | ✓ | SKU code, uppercased |
| B (1) | max_quanity | | Max quantity alert threshold |
| C (2) | min_quanity | | Min quantity alert threshold |
| D (3) | description | | |
| E (4) | brand | | Brand name — auto-created |
| F (5) | unit | | |
| G (6) | max_price | | |
| H (7) | min_price | | |

**Header row**: Row 1 (data starts at row 2)

### Instock Sheet Columns

| Col | Field | Required | Notes |
|-----|-------|----------|-------|
| A (0) | stock_date | | Date value |
| B (1) | invoice_id | ✓ | Invoice reference |
| C (2) | purchase_order_id | | PO reference |
| D (3) | job | | Job ID — auto-created in Job table if missing |
| E (4) | supplier | | Supplier name |
| F (5) | item (code) | ✓ | Must match existing Item.code (uppercased) |
| G (6) | quantity | | Decimal |
| H (7) | price | | Unit price (decimal) |

**Header row**: Row 1 (data starts at row 2)

**Side effects**: Updates Item aggregates — `quantity += qty`, `sum_price += price*qty`, `min_price`/`max_price` adjusted, `instock_number` incremented.

### Outstock Sheet Columns

| Col | Field | Required | Notes |
|-----|-------|----------|-------|
| A (0) | stock_date | | Date value |
| B (1) | job | ✓ | Job ID — auto-created if missing |
| C (2) | customer | | Customer name — auto-created if missing |
| D (3) | stock_id | | Stock reference ID |
| E (4) | requester | | Person requesting |
| F (5) | department | | Department name |
| G (6) | item (code) | ✓ | Must match existing Item.code (uppercased) |
| H (7) | quantity | | Decimal |

**Header row**: Configurable (`outstock_header_row`) — ACC=1, METAL=2. Data starts at `header_row + 2`.

**Side effects**: Updates Item — `quantity -= qty` (floored at 0), `outstock_number` incremented.

### Import Behavior

- **Batch processing**: Flushes every 200 rows
- **Progress tracking**: Saves to `data/progress.json` — supports resume on crash
- **Invalid rows**: Logged to `static/stockmanagement/invalid_*.csv`
- **Duplicate items**: Skipped (logged)
- **Missing items**: Instock/outstock rows referencing non-existent item codes are skipped (logged as CRIT)
- **Jobs**: Auto-created via `get_or_create` if not found. Handles Excel float artifacts (e.g., "123.0" → "123")
