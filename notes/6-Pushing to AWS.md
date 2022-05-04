# Pushing to AWS

Github -> Travis CI -> AWS

Set up a github repo for the project

## Travis CI flow

- Tell Travis we need Docker running
- Run our dockerfile.dev
- Tell travis how to run our test suite
- tell travis how to deploy code to aws

```yml
language: generic
sudo: required
services:
  - docker

before_install:
  - docker build -t evgeniyp92/docker-react -f dockerfile.dev .

script:
  - docker run -e CI=true evgeniyp92/docker-react npm run test
```

## new docker-compose-dev.yml

```yml
version: '3'

services:
  web:
    build:
      # where to pull all the files from
      context: .
      # specifying where to go for the dockerfile
      dockerfile: dockerfile.dev
    ports:
      # Map the default port
      - '3000:3000'
    volumes:
      # Leave node_modules alone
      - /app/node_modules
      # Mount the rest of the files
      - .:/app
  tests:
    build:
      context: .
      dockerfile: dockerfile.dev
    volumes:
      - /app/node_modules
      - .:/app
    command: ['npm', 'run', 'test']
```

## new docker-compose.yml

```yml
version: '3'
services:
  web:
    build:
      context: .
      dockerfile: dockerfile
    ports:
      - '80:80'
```

## Updating travis file to push code up to EBS

```yml
language: generic
sudo: required
services:
  - docker

before_install:
  - docker build -t evgeniyp92/docker-react -f dockerfile.dev .

script:
  - docker run -e CI=true evgeniyp92/docker-react npm run test

deploy:
  provider: elasticbeanstalk
  region: 'us-east-1'
  app: 'docker'
  env: 'Docker-env'
  bucket_name: 'elasticbeanstalk-us-east-1-321861476458'
  bucket_path: 'docker'
  on:
    branch: master
```

## using environment secrets with travis ci

```yml
deploy:
  provider: elasticbeanstalk
  region: 'us-east-1'
  app: 'docker'
  env: 'Docker-env'
  bucket_name: 'elasticbeanstalk-us-east-1-321861476458'
  bucket_path: 'docker'
  on:
    branch: master
  access_key_id: $AWS_ACCESS_KEY
  secret_access_key: $AWS_SECRET_KEY
```

for aws its important to expose containers in dockerfiles

`EXPOSE [port number]`

# AWS DOCKER CANNOT HANDLE MORE THAN 1 ARG IN FROM DO NOT PASS 'AS BUILDER'
