# stockmanager
PC Elemac Stock Management System

## Deploy AWS
### DJango with Elastic Beanstalk
https://realpython.com/deploying-a-django-app-and-postgresql-to-aws-elastic-beanstalk/

* Use premade configs within this repo instead of suggested ones in article
* Follow Postgresql RDS creation guide but select **instance** db.t4g.micro for cheapest database as of writing (others can be selected, less than t2/t1 not supported for Postgresql)
* Ensure awsebcli, future and any python packages containing 'win' (if using windows) are removed from requirements.txt (this has already been completed for this project) when you run `pip freeze > requirements.txt` as this will cause an error with deployment. https://stackoverflow.com/questions/39493756/aws-elastic-beanstalk-error-requirements-txt
* Replace psycopg2 with aws-pycopg2 in `requirements.txt` and implement relevant setup for Postgresql as seen in `.ebextensions/python.config`

### React with S3
https://medium.com/serverlessguru/deploy-reactjs-app-with-s3-static-hosting-f640cb49d7e6

* Follow guide but if using npm use `npm run build & npm run deploy` after setting deploy to (the suggested code in guide does not work use this instead renaming pcelemac-serverless to your s3 bucket ![image](https://user-images.githubusercontent.com/25617815/150687553-30d6b14d-c518-48c4-83d5-b6c7668b65ca.png)
