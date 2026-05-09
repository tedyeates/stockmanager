# Project Structure

Monorepo with a Django backend and a React frontend as sibling directories.

```
stockmanager/
├── stockmanagement_bg/          # Django backend
│   ├── stockmanagement_bg/      # Django project settings & root URL config
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── forms.py
│   ├── stockmanagement/         # Main Django app (items, instock, outstock)
│   │   ├── models.py            # Domain models (Group, Brand, Item, Instock, Outstock)
│   │   ├── views.py             # DRF ViewSets
│   │   ├── serializers.py       # DRF serializers
│   │   ├── urls.py              # API router (/api/group, /api/item, /api/instock, /api/outstock)
│   │   ├── util/                # Backend utilities
│   │   ├── import_progress/     # Import functionality
│   │   └── management/          # Django management commands
│   ├── login/                   # Auth app (token login)
│   ├── static/                  # Collected static files
│   ├── Dockerfile
│   ├── fly.toml
│   ├── requirements.txt
│   └── manage.py
│
├── stockmanagement-fe/          # React frontend
│   ├── src/
│   │   ├── index.tsx            # Entry point
│   │   ├── pages/
│   │   │   ├── App.tsx          # Root component
│   │   │   ├── Navbar.tsx       # Navigation bar
│   │   │   ├── context/         # React context providers (Login, PageChanger, PopupContextManager)
│   │   │   ├── customhooks/     # Custom React hooks (pagination, page updates)
│   │   │   ├── popup/           # Modal/popup components (Forms, Errors, Popups)
│   │   │   └── table/           # Table components (Table, Pagination, Search, TableToolbar)
│   │   ├── styles/              # CSS files (index, navbar, buttons, forms, themes, etc.)
│   │   └── util/
│   │       ├── constants.tsx    # App-wide constants
│   │       ├── requests.tsx     # HTTP request utility (fetch wrapper)
│   │       ├── strings.tsx      # String utilities
│   │       └── types/           # TypeScript type definitions
│   ├── cypress/                 # E2E tests
│   ├── public/
│   └── package.json
│
└── .kiro/                       # Kiro configuration
    └── steering/                # Steering documents
```

## Architecture Patterns

- **Backend**: Standard Django app layout with DRF ViewSets and a DefaultRouter for RESTful endpoints
- **Frontend**: Component-based React with context providers for state management (no Redux)
- **State flow**: Context providers (`PageChanger`, `PopupContextManager`, `Login`) manage global state; custom hooks encapsulate reusable logic
- **API communication**: Custom `Requests` class wrapping native `fetch` — not Axios (Axios is listed as a dependency but the codebase uses the custom wrapper)
- **Styling**: Hybrid approach — Tailwind utility classes combined with custom CSS files per component area
