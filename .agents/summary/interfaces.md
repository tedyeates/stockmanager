# Interfaces

## REST API

**Base URL**: `{VITE_BASE_URL}/api/`  
**Auth**: `Authorization: Token <token>` header on all requests  
**Pagination**: `PageNumberPagination`, 19 items per page  
**Content-Type**: `application/json`

### Authentication

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/login/` | `{"username": "...", "password": "..."}` | `{"token": "...", "username": "..."}` |

### CRUD Endpoints (via DefaultRouter)

All CRUD endpoints follow the same pattern through `FormDataMixin`:

| Resource | List/Create | Retrieve/Update/Delete | Search Fields |
|----------|-------------|------------------------|---------------|
| Group | `GET/POST /api/group/` | `GET/PUT/DELETE /api/group/{id}/` | name, description |
| Item | `GET/POST /api/item/` | `GET/PUT/DELETE /api/item/{id}/` | code, description, unit, group__name, brand__name, notes |
| Instock | `GET/POST /api/instock/` | `GET/PUT/DELETE /api/instock/{id}/` | invoice_id, purchase_order_id, supplier, item__code, store_type, notes |
| Outstock | `GET/POST /api/outstock/` | `GET/PUT/DELETE /api/outstock/{id}/` | stock_id, requester, department, item__code, customer__name, store_type, notes |

### Read-Only Endpoints

| Resource | Endpoint | Search Fields |
|----------|----------|---------------|
| Job | `GET /api/job/` | job_id |
| Brand | `GET /api/brand/` | name |
| Customer | `GET /api/customer/` | name |

### Filter Fields

**Item** (`?field__lookup=value`):
- `quantity`, `max_price`, `min_price`, `sum_price`, `min_quanity`, `max_quanity` — supports `exact`, `gte`, `lte`

**Instock**:
- `quantity`, `price`, `stock_date` — supports `exact`, `gte`, `lte`

**Outstock**:
- `quantity`, `remaining_quantity`, `stock_date` — supports `exact`, `gte`, `lte`

### Search

All searchable endpoints support `?search=<term>` query parameter. DRF's `SearchFilter` performs case-insensitive partial matching across configured `search_fields`.

### Export

| Method | Endpoint | Response |
|--------|----------|----------|
| GET | `/api/{resource}/export/` | CSV file download (respects current search/filter) |

Available for: group, item, instock, outstock.

### Pagination Response Shape

```json
{
  "count": 150,
  "next": "http://host/api/item/?page=2",
  "previous": null,
  "results": [...]
}
```

---

## Field Metadata API

Serves dynamic field definitions for frontend form/table generation.

| Method | Endpoint | Response |
|--------|----------|----------|
| GET | `/fields/group` | Field definitions for Group |
| GET | `/fields/item` | Field definitions for Item |
| GET | `/fields/instock` | Field definitions for Instock |
| GET | `/fields/outstock` | Field definitions for Outstock |

### Response Shape

```json
[
  {
    "fieldName": "code",
    "fieldType": "CharField",
    "fieldChoices": null,
    "required": true
  },
  {
    "fieldName": "store_type",
    "fieldType": "ChoiceField",
    "fieldChoices": ["metal", "accessory", "machine", "service"],
    "required": true
  },
  {
    "fieldName": "item",
    "fieldType": "ForeignKey",
    "fieldChoices": null,
    "required": true
  },
  {
    "fieldName": "job",
    "fieldType": "ManyToManyField",
    "fieldChoices": null,
    "required": false
  }
]
```

### Field Types → Frontend Controls

| `fieldType` | Rendered As |
|-------------|-------------|
| `CharField` | Text input |
| `DecimalField` / `IntegerField` | Number input |
| `DateField` | Date picker |
| `ChoiceField` | Select dropdown |
| `ForeignKey` | `ModelAutocomplete` (search-as-you-type) |
| `ManyToManyField` / `ManyToManyRel` | `MultiModelAutocomplete` (multi-select) |
| `BooleanField` | Checkbox |

---

## Request/Response Examples

### Create Instock

**Request**: `POST /api/instock/`
```json
{
  "stock_date": "15/06/2024",
  "item": 42,
  "job": [1, 2],
  "invoice_id": "INV-001",
  "price": "15.50",
  "supplier": "Acme Corp",
  "purchase_order_id": "PO-200",
  "quantity": "100.00",
  "store_type": "metal",
  "notes": ""
}
```

**Response**: `201 Created`
```json
{
  "id": 501,
  "stock_date": "15/06/2024",
  "item": {"id": 42, "code": "GL2020"},
  "job": ["JOB-001", "JOB-002"],
  "invoice_id": "INV-001",
  "price": "15.50",
  "supplier": "Acme Corp",
  "purchase_order_id": "PO-200",
  "quantity": "100.00",
  "store_type": "metal",
  "notes": ""
}
```

### Create Outstock (Validation Error)

**Request**: `POST /api/outstock/`
```json
{
  "item": 42,
  "quantity": "9999.00",
  "requester": "John",
  "department": "Workshop"
}
```

**Response**: `400 Bad Request`
```json
{
  "quantity": ["Not enough items instock. Only 50.00 items remain"]
}
```

---

## Internal Frontend Interfaces

### `Requests` Class (util/requests.tsx)

```typescript
class Requests {
  static get(url: string, headers?: HeadersInit): Promise<any>
  static post(url: string, data: BodyInit, headers?: HeadersInit): Promise<any>
  static put(url: string, data: BodyInit, headers?: HeadersInit): Promise<any>
  static delete(url: string, headers?: HeadersInit): Promise<any>
}

class RequestError extends Error {
  status: number
  responseData: any
}
```

### Key TypeScript Types (util/types/PageTypes.tsx)

- `PageName` — `"instock" | "outstock" | "item" | "group"` (literal union)
- `DataType` — `Record<string, any>` (single row)
- `DataTypeArray` — `DataType[]`
- `FieldsDataType` — Array of field metadata objects from `/fields/*`
- `PaginationType` — `{currentPageNumber, changePageNumberTo, changePageNumberToNextPage, changePageNumberToPreviousPage}`
- `PageDisplayType` — `{pageNumbersToDisplay, numberOfResults, hasNextPage, hasPreviousPage}`
