# Architecture

## System Overview

```mermaid
graph TB
    subgraph Frontend["Frontend (Vercel)"]
        React[React SPA]
    end
    
    subgraph Backend["Backend (Fly.io)"]
        DRF[Django REST Framework]
        Django[Django ORM]
    end
    
    subgraph Database["Database (Supabase)"]
        PG[(PostgreSQL)]
        ExtTables[External Tables<br/>customer, job]
    end
    
    React -->|"Token Auth + REST"| DRF
    DRF --> Django
    Django --> PG
    Django -.->|"managed=False"| ExtTables
```

## Architecture Style

**Client-server REST** — Single-page React app communicates with a Django REST API. No server-side rendering. Frontend and backend deployed independently.

## Backend Architecture

```mermaid
graph LR
    subgraph URLs["URL Routing"]
        Router[DefaultRouter]
        FieldPaths["/fields/* paths"]
    end
    
    subgraph Views["ViewSets"]
        FDM[FormDataMixin<br/>extends ModelViewSet]
        FVM[FieldViewMixin<br/>extends APIView]
        RO[ReadOnlyModelViewSet]
    end
    
    subgraph Models["Domain Layer"]
        Managers[Custom Managers<br/>InstockManager<br/>OutstockManager]
        DomainModels[Models<br/>Group, Item, Instock, Outstock]
    end
    
    Router --> FDM
    FieldPaths --> FVM
    Router --> RO
    FDM --> Managers
    Managers --> DomainModels
```

### Key Design Decisions

1. **Custom ViewSet base (`FormDataMixin`)** — Extends `ModelViewSet` with:
   - Automatic related-key resolution (nested objects → IDs before save)
   - Separate serializers for read vs write vs export
   - CSV export action
   - Pagination via DRF's `PageNumberPagination`

2. **Field metadata API (`FieldViewMixin`)** — Serves model field definitions (name, type, choices, required) so the frontend dynamically builds forms/tables without hardcoding fields.

3. **Business logic in Managers** — `InstockManager` and `OutstockManager` encapsulate transactional stock operations (quantity adjustment, price recalculation) using `@transaction.atomic`.

4. **Unmanaged models** — `Customer` and `Job` map to pre-existing external database tables (`managed = False`). Django doesn't create/migrate these tables.

## Frontend Architecture

```mermaid
graph TB
    subgraph Providers["Context Providers"]
        Auth[AuthProvider<br/>Token + session storage]
        PC[PageTypeChangerProvider<br/>Data fetching + pagination]
        IE[InlineEditingProvider<br/>Row editing state]
    end
    
    subgraph Components["UI Layer"]
        App[App]
        Navbar[Navbar]
        TableToolbar[TableToolbar]
        Table[Table]
        EditableRow[EditableRow]
        EditableCell[EditableCell]
    end
    
    subgraph Utils["Utilities"]
        Requests[Requests class]
        Validation[validation.ts]
        FieldMapper[fieldMapper.ts]
    end
    
    Auth --> PC
    PC --> IE
    IE --> App
    App --> Navbar
    App --> TableToolbar
    App --> Table
    Table --> EditableRow
    EditableRow --> EditableCell
    EditableRow --> Requests
    EditableRow --> Validation
```

### Frontend Design Decisions

1. **Context-based state** — No Redux/Zustand. Three React context providers manage all global state:
   - `AuthProvider` — token storage, auth headers, login/logout
   - `PageTypeChangerProvider` — current page, data fetching, search, pagination
   - `InlineEditingProvider` — edit/create mode, field state, validation, save

2. **Custom HTTP class (`Requests`)** — Static methods wrapping native `fetch`. Throws typed `RequestError` with status + response data. No Axios at runtime despite being listed historically.

3. **Dynamic table rendering** — Table columns and editable cells are generated from API field metadata (`/fields/*` endpoints), not hardcoded per model.

4. **Inline editing** — Click a row to edit in-place. No modal forms for CRUD. New rows appear at top of table.

## Data Flow

```mermaid
sequenceDiagram
    participant User
    participant React as React (PageChanger)
    participant API as Django API
    participant DB as PostgreSQL
    
    User->>React: Navigate to "instock" tab
    React->>API: GET /api/instock/?page=1
    API->>DB: Query with pagination
    DB-->>API: Results
    API-->>React: {count, results, next, previous}
    React->>React: Render table rows
    
    User->>React: Click row to edit
    React->>React: InlineEditing.startEditing(rowData)
    User->>React: Modify fields, click save
    React->>React: validateRow(data, fieldDefs)
    React->>API: PUT /api/instock/{id}/
    API->>DB: Update + recalculate prices
    DB-->>API: OK
    API-->>React: Updated record
    React->>React: refreshPage() → re-fetch
```

## Deployment Topology

```mermaid
graph LR
    subgraph User
        Browser[Browser]
    end
    
    subgraph Vercel
        SPA[React SPA<br/>Static files]
    end
    
    subgraph FlyIO["Fly.io"]
        Gunicorn[Gunicorn]
        DjangoApp[Django]
    end
    
    subgraph Supabase
        PostgreSQL[(PostgreSQL)]
    end
    
    Browser --> SPA
    SPA -->|"HTTPS REST"| Gunicorn
    Gunicorn --> DjangoApp
    DjangoApp --> PostgreSQL
```

- **Frontend**: Static build on Vercel with environment-specific API URL
- **Backend**: Fly.io with auto-stop (free tier), migrations run via `release_command`
- **Database**: Supabase-managed PostgreSQL
- **Auth flow**: POST `/login/` → receive token → include `Authorization: Token <token>` on all API calls
