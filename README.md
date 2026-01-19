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

Omit the two AWS related addresses on initial deploy, as you can obtain these from AWS after deploying. Afterwards update `.env` and redeploy

### Create Django Secret Key
```
import secrets

print(secrets.token_urlsafe())
```
Copy and paste into .env file


