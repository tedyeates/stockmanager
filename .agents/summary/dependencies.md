# Dependencies

## Backend (Python)

Source: `stockmanagement_bg/requirements.txt`

### Core Framework

| Package | Role |
|---------|------|
| Django>=4.2.16 | Web framework |
| djangorestframework>=3.15.2 | REST API framework |
| django-filter>=23.0 | QuerySet filtering for API endpoints |
| django-cors-headers>=4.3.1 | CORS handling for frontend-backend communication |
| django-environ>=0.11.2 | `.env` file parsing for settings |
| python-decouple>=3.8 | Additional env/config parsing |
| gunicorn>=22.0.0 | Production WSGI server |

### Database

| Package | Role |
|---------|------|
| psycopg2>=2.9.11 | PostgreSQL adapter (C extension) |
| psycopg2-binary>=2.9.11 | Pre-built PostgreSQL adapter (dev convenience) |

### Data Processing

| Package | Role |
|---------|------|
| openpyxl>=3.1.2 | Excel file reading for stock data import |

### UI/Admin (Legacy)

| Package | Role |
|---------|------|
| bootstrap4==0.1.0 | Bootstrap template helpers (admin/forms) |
| django-crispy-forms>=2.3 | Form rendering with Bootstrap |
| django-extensions>=3.2.3 | Management command utilities |

### HTTP/Networking

| Package | Role |
|---------|------|
| requests>=2.32.2 | HTTP client (may be used for external integrations) |
| certifi>=2024.2.2 | SSL certificate bundle |

### Testing

| Package | Role |
|---------|------|
| hypothesis>=6.0 | Property-based testing |
| hypothesis[django] | Django-specific Hypothesis strategies |

### Other Utilities

| Package | Role |
|---------|------|
| PyYAML>=6.0.1 | YAML parsing |
| pipdeptree>=2.23.0 | Dependency tree visualization |
| pathspec>=0.12.1 | Gitignore-style path matching |
| colorama>=0.4.6 | Terminal color output (Windows) |

---

## Frontend (Node.js)

Source: `stockmanagement-fe/package.json`

### Core

| Package | Version | Role |
|---------|---------|------|
| react | ^18.3.1 | UI framework |
| react-dom | ^18.3.1 | React DOM rendering |
| react-router-dom | ^6.30.3 | Client-side routing |
| typescript | ^5.8.0 | Type system |

### UI Components

| Package | Version | Role |
|---------|---------|------|
| @mui/material | ^5.18.0 | Material Design components (Login page, icons) |
| @mui/icons-material | ^5.18.0 | MUI icon set |
| @emotion/react | ^11.14.0 | CSS-in-JS for MUI |
| @emotion/styled | ^11.14.1 | Styled components for MUI |
| @heroicons/react | ^1.0.6 | Heroicons SVG icons |
| react-icons | ^4.12.0 | Multi-library icon set |
| @fontsource/roboto | ^5.2.10 | Roboto font for MUI |

### Utilities

| Package | Version | Role |
|---------|---------|------|
| decimal.js | ^10.6.0 | Precise decimal arithmetic (total price calc) |
| lodash | ^4.17.21 | General utilities (debounce, etc.) |
| js-file-download | ^0.4.12 | Trigger browser file downloads (CSV export) |
| react-datepicker | ^4.25.0 | Date input component |

### Build & Dev

| Package | Version | Role |
|---------|---------|------|
| vite | ^6.3.5 | Build tool and dev server |
| @vitejs/plugin-react | ^4.4.1 | React support for Vite |
| tailwindcss | ^3.4.19 | Utility-first CSS framework |
| postcss | ^8.5.3 | CSS processing pipeline |
| autoprefixer | ^10.5.0 | Browser prefix automation |

### Testing

| Package | Version | Role |
|---------|---------|------|
| vitest | ^4.1.5 | Test runner (Vite-native) |
| @testing-library/react | ^16.3.2 | React component testing utilities |
| @testing-library/jest-dom | ^6.9.1 | DOM assertion matchers |
| fast-check | ^4.7.0 | Property-based testing |
| chance | ^1.1.13 | Random data generation for tests |
| jsdom | ^29.1.1 | DOM simulation for tests |

---

## Dependency Patterns & Notes

1. **No Axios at runtime** — Despite historical mentions, the codebase uses a custom `Requests` class wrapping native `fetch`. Axios is not in `package.json`.

2. **Dual PostgreSQL packages** — Both `psycopg2` and `psycopg2-binary` are listed. In production (Fly.io Docker), the C-compiled `psycopg2` is used. The binary variant simplifies local dev.

3. **Property-based testing in both layers** — Backend uses `hypothesis`; frontend uses `fast-check`. Both generate random inputs to find edge cases.

4. **MUI used sparingly** — Only for the Login page and some icons. Main UI uses Tailwind + custom CSS. Not a full MUI design system.

5. **Legacy admin packages** — `bootstrap4`, `crispy_forms` are for Django admin customization, not the main app. Could be removed if admin isn't used.

6. **`decimal.js`** — Used in Table component to compute instock total price (`price × quantity`) with precision. Avoids floating-point issues.
