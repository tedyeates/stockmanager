# stockmanager
PC Elemac Stock Management System

## Quick Start

After downloading you will need to create a `.env` file in the same folder as `manage.py` before deploying with the following attributes:
```
SECRET_KEY=<Django Secret Key (Can be randomly generated *see below*)> 
ALLOWED_HOSTS=<Elastic Beanstalk Address (Obtained after AWS Deployment)>, <React S3 Bucket Address (Obtained after AWS Deployment)>, 127.0.0.1, localhost
SUPER_USER_USERNAME=<Username for Super User Access to Django Website>
SUPER_USER_PASSWORD=<Password for Super User Access to Django Website>
```

Omit the two AWS related addresses on initial deploy, as you can obtain these from AWS after deploying. Afterwards update `.env` and redeploy.

### Create Django Secret Key
```python
import secrets
print(secrets.token_urlsafe())
```
Copy and paste into `.env` file.

## Running Locally

### Prerequisites
- Python 3.9+
- Node.js and npm

### Django Backend

1. Create and activate a virtual environment:
```bash
python -m venv django-env
django-env\Scripts\activate   # Windows
# source django-env/bin/activate  # macOS/Linux
```

2. Install dependencies:
```bash
cd stockmanagement_bg
pip install -r requirements.txt
```

3. Run migrations and start the server:
```bash
python manage.py migrate
python manage.py runserver
```
The API will be available at `http://127.0.0.1:8000`.

### React Frontend

1. Install dependencies:
```bash
cd stockmanagement-fe
npm install
```

2. Start the development server:
```bash
npm start
```
The app will be available at `http://localhost:3000`.


