# Codebase Information

## Project

- **Name**: PC Elemac Stock Management System
- **Purpose**: Inventory management for tracking stock items, inbound receipts (instock), and outbound withdrawals (outstock)
- **Repository Structure**: Monorepo with Django backend and React frontend as sibling directories

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend Language | Python 3.9+ |
| Backend Framework | Django 4.2+ / Django REST Framework |
| Database | PostgreSQL (Supabase) |
| Frontend Language | TypeScript |
| Frontend Framework | React 18 (Vite) |
| UI Library | Material UI 5 |
| Styling | Tailwind CSS 3 + custom CSS |
| HTTP Client | Native fetch (custom `Requests` class) |
| Routing | react-router-dom 6 |
| Auth | DRF Token Authentication |
| Backend Hosting | Fly.io |
| Frontend Hosting | Vercel |
| Testing (FE) | Vitest + fast-check (property-based) |
| Testing (BE) | Django TestCase + Hypothesis (property-based) |
| E2E | Cypress |

## Directory Layout

```
stockmanager/
├── stockmanagement_bg/          # Django backend
│   ├── stockmanagement_bg/      # Django project (settings, urls, wsgi)
│   ├── stockmanagement/         # Main app (models, views, serializers, utils)
│   ├── login/                   # Auth app (token login/signup)
│   ├── manage.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── fly.toml
├── stockmanagement-fe/          # React frontend
│   ├── src/
│   │   ├── pages/               # Components (App, Navbar, table/, context/, popup/)
│   │   ├── util/                # Requests, types, constants, validation, helpers
│   │   └── styles/              # CSS files
│   ├── cypress/                 # E2E tests
│   ├── package.json
│   └── vite.config.ts
└── .kiro/                       # Agent configuration
```

## Languages Detected

- **Python** — Backend (Django app, management commands, tests)
- **TypeScript/TSX** — Frontend (React components, utilities, tests)
- **CSS** — Styling
- **SQL** — Migrations (auto-generated)

## Key Configuration Files

| File | Purpose |
|------|---------|
| `stockmanagement_bg/.env` | Backend secrets (DATABASE_URL, SECRET_KEY) |
| `stockmanagement-fe/.env.development` | Frontend dev API base URL |
| `stockmanagement-fe/.env.production` | Frontend prod API base URL |
| `stockmanagement_bg/fly.toml` | Fly.io deployment config |
| `stockmanagement-fe/vercel.json` | Vercel deployment config |
| `stockmanagement_bg/stockmanagement_bg/settings.py` | Django settings |

## API Configuration

- **Base path**: `/api/`
- **Pagination**: PageNumberPagination, PAGE_SIZE = 19
- **Auth**: Token-based (`Authorization: Token <token>`)
- **CORS**: django-cors-headers (allow all in dev)
- **Filters**: django-filter + DRF SearchFilter
