# Tech Stack

## Backend (`stockmanagement_bg/`)

- **Language**: Python 3.9+
- **Framework**: Django 4.2+ with Django REST Framework
- **Database**: PostgreSQL (via psycopg2)
- **Auth**: DRF Token Authentication
- **CORS**: django-cors-headers
- **Environment**: django-environ (`.env` file in `stockmanagement_bg/`)
- **WSGI Server**: Gunicorn

## Frontend (`stockmanagement-fe/`)

- **Language**: TypeScript
- **Framework**: React 18 (Create React App / react-scripts 5)
- **UI Library**: Material UI 5 (@mui/material)
- **Styling**: Tailwind CSS 3 + PostCSS + custom CSS files
- **HTTP Client**: Native fetch (custom `Requests` utility class)
- **Routing**: react-router-dom 6
- **Icons**: Heroicons, react-icons, MUI Icons

## Common Commands

### Backend

```bash
cd stockmanagement_bg
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver          # Dev server at :8000
python manage.py collectstatic      # Collect static files for production
```

### Frontend

```bash
cd stockmanagement-fe
npm install
npm start                           # Dev server at :3000
npm run build                       # Production build
npm run e2e                         # Open Cypress interactive
npm run e2e:run                     # Run Cypress headless
npm run deploy                      # Sync build to S3
```

## API Configuration

- REST pagination: PageNumberPagination, PAGE_SIZE = 19
- Frontend dev API base: configured via `.env.development`
- Frontend prod API base: configured via `.env.production`
