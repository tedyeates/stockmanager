# AGENTS.md — PC Elemac Stock Management System

> Inventory management app: Django REST backend + React SPA frontend. Tracks items, inbound receipts (instock), and outbound withdrawals (outstock).

## Directory Map

```
stockmanager/
├── stockmanagement_bg/              # Django backend
│   ├── stockmanagement_bg/          # Project config (settings.py, urls.py, wsgi.py)
│   ├── stockmanagement/             # Main app — domain logic lives here
│   │   ├── models.py                # Group, Brand, Item, Instock, Outstock + custom managers
│   │   ├── views.py                 # DRF ViewSets (CRUD + stock operations)
│   │   ├── serializers.py           # Read/write/export serializer variants
│   │   ├── urls.py                  # API router + field metadata paths
│   │   ├── util/custom_viewsets.py  # FormDataMixin, FieldViewMixin (base classes)
│   │   ├── util/load_data_excel.py  # Excel import with batch processing
│   │   └── management/commands/     # loadstock, createsu, reset_django_tables
│   ├── login/                       # Token auth app
│   └── requirements.txt
├── stockmanagement-fe/              # React frontend
│   ├── src/pages/context/           # State: PageChanger, InlineEditing, Login providers
│   ├── src/pages/table/             # Table, EditableRow, EditableCell, Autocomplete
│   ├── src/util/                    # Requests class, validation, types, fieldMapper
│   └── package.json
└── .agents/summary/                 # Detailed documentation (see index.md)
```

## Architecture Overview

- **Backend**: Django 4.2+ / DRF with custom `FormDataMixin` (extends ModelViewSet) and `FieldViewMixin` (serves field metadata)
- **Frontend**: React 18 / TypeScript / Vite with context-based state (no Redux)
- **Database**: PostgreSQL on Supabase. Two unmanaged tables (`customer`, `job`) from external system
- **Hosting**: Fly.io (backend, auto-stop enabled) + Vercel (frontend static)
- **Auth**: DRF Token Authentication → sessionStorage

## Key Patterns (Non-Obvious)

### Backend

- **`FormDataMixin`** (`util/custom_viewsets.py`) — All CRUD ViewSets inherit this. It auto-resolves nested related objects to IDs before DRF validation (`related_object_to_id`), supports separate serializers for read/write/export, and adds a `/export/` CSV action.

- **`FieldViewMixin`** — Introspects Django model fields and serves metadata (`fieldName`, `fieldType`, `fieldChoices`, `required`) to frontend. This is how the frontend renders forms dynamically without hardcoding fields.

- **Stock Managers** — Business logic for quantity/price management lives in `InstockManager` and `OutstockManager` (not in views). All stock operations use `@transaction.atomic`.

- **Outstock creation** uses `OutstockManager.create_outstock()` which validates available quantity, updates item, and snapshots `remaining_quantity`. The ViewSet delegates to the manager.

- **Instock creation** has price logic in BOTH `InstockManager.create_instock()` AND `InstockViewSet.create()`. The ViewSet version is the active code path for API requests.

- **`FlexibleForeignKeyField`** — Custom serializer field that accepts either a PK (int) or name (string) for foreign key lookups.

### Frontend

- **No Axios** — Uses custom `Requests` class wrapping native `fetch`. Throws typed `RequestError(status, responseData)`.

- **Inline editing** — Click row → edit in-place (no modals). `InlineEditingProvider` manages edit/create state. Save triggers PUT/POST, then `refreshPage()`.

- **Dynamic form generation** — Field metadata from `/fields/*` drives what inputs render. `EditableCell` maps `fieldType` to control type (text, number, date, select, autocomplete).

- **`ModelAutocomplete`** / **`MultiModelAutocomplete`** — Search-as-you-type dropdowns for FK and M2M fields. Hit the related model's list endpoint with `?search=`.

- **Move to Outstock** — Instock rows can be "moved" to outstock: extracts relevant fields, switches page, pre-fills create row.

## API Structure

Base: `/api/` — All require `Authorization: Token <token>`

| Endpoint | ViewSet | Notes |
|----------|---------|-------|
| `/api/group/` | GroupViewSet | CRUD |
| `/api/item/` | ItemViewSet | CRUD + numeric filters (quantity, prices) |
| `/api/instock/` | InstockViewSet | CRUD + price recalculation on create/update |
| `/api/outstock/` | OutstockViewSet | CRUD + quantity validation (cannot exceed stock) |
| `/api/job/` | JobViewSet | Read-only (unmanaged table) |
| `/api/brand/` | BrandViewSet | Read-only |
| `/api/customer/` | CustomerViewSet | Read-only (unmanaged table) |
| `/fields/{model}` | FieldViewMixin | Field metadata for dynamic forms |
| `/api/{model}/export/` | FormDataMixin action | CSV download (respects search/filter) |

Pagination: 19 items/page. Search: `?search=term`. Filters: `?field__gte=X&field__lte=Y`.

## Domain Rules

1. Outstock quantity cannot exceed `item.quantity`
2. Instock creation updates item's `quantity`, `sum_price`, `min_price`, `max_price`, `instock_number`
3. Outstock creation decrements `item.quantity`, increments `outstock_number`, stores `remaining_quantity`
4. Instock update reverses old price/quantity contributions then applies new ones
5. All stock operations are atomic (transaction rollback on failure)

## Config & Secrets

- Backend `.env` at `stockmanagement_bg/.env`: `SECRET_KEY`, `DATABASE_URL`, `DEBUG`, `ALLOWED_HOSTS`, `CORS_ALLOW_ALL_ORIGINS`
- Frontend env: `.env.development` (localhost:8000), `.env.production` (fly.dev URL) — `VITE_BASE_URL` variable
- Fly.io secrets: `SECRET_KEY`, `DATABASE_URL`, `ALLOWED_HOSTS`, `SUPER_USER_USERNAME`, `SUPER_USER_PASSWORD`

## Testing

- **Backend**: `python manage.py test` — Hypothesis property-based tests for search, inline editing API
- **Frontend**: `npm test` (Vitest) — fast-check property tests + @testing-library/react unit tests
- **E2E**: Cypress in `stockmanagement-fe/cypress/`

## Detailed Documentation

For deeper analysis, see `.agents/summary/index.md` — contains navigation guide to architecture, components, interfaces, data models, workflows, and dependencies docs.

## Custom Instructions
<!-- This section is for human and agent-maintained operational knowledge.
     Add repo-specific conventions, gotchas, and workflow rules here.
     This section is preserved exactly as-is when re-running codebase-summary. -->
