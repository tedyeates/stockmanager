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
```import secrets

print(secrets.token_urlsafe())
```
Copy and paste into .env file

## Deploy AWS
### DJango with Elastic Beanstalk
[Deploy Django with Postgresql](https://realpython.com/deploying-a-django-app-and-postgresql-to-aws-elastic-beanstalk/). Useful documentation but outdated for AWS EB Linux 2, please make the following edits:

* Use premade configs within this repo instead of suggested ones in article
* Follow Postgresql RDS creation guide but select **instance** db.t4g.micro for cheapest database as of writing (others can be selected, less than t2/t1 not supported for Postgresql)
* Ensure awsebcli, future and any python packages containing 'win' (if using windows) are removed from requirements.txt (this has already been completed for this project) when you run `pip freeze > requirements.txt` as this will cause an error with deployment. https://stackoverflow.com/questions/39493756/aws-elastic-beanstalk-error-requirements-txt
* psycopg2 requires pg_config which requires compiling binaries so instead replace this with aws-psycopg2 in `requirements.txt` and implement relevant setup for Postgresql as seen in `.ebextensions/python.config` [Django with Postgresql Linux 2](https://scriptreference.com/deploying-django-with-postgresql-on-elastic-beanstalk-and-amazon-linux-2/)

* Remove migration and creatsu commands from `.ebextensions/python.config` on initial run as you will need Elastic Beanstalk to be in a ready state before you can add a database. After initial deploy, add the database as described above, readd the commands and redeploy

### React with S3
[React Hosting on S3](https://medium.com/serverlessguru/deploy-reactjs-app-with-s3-static-hosting-f640cb49d7e6)

* Follow guide but if using npm use `npm run build & npm run deploy` after setting deploy to (the suggested code in guide does not work use this instead renaming pcelemac-serverless to your s3 bucket ![image](https://user-images.githubusercontent.com/25617815/150687553-30d6b14d-c518-48c4-83d5-b6c7668b65ca.png)
