# Building a multi-container application

There are some issues with a single container

- The app was simple and limited in scope -- it had no outside dependencies
- The image was built many times, without a good reason
- How do we connect to a database from a container?

We will do a program on the fibonnaci sequence

1 1 2 3 5 8 13 21 etc etc

we will go full overkill on this project, this is a super easy project irl. its
just [i-1] + [i-2]

```javascript
const fibArray = [0, 1, 1];
for (let i = 3; i < 100; i++) fibArray.push(fibArray[i - 1] + fibArray[i - 2]);
console.log(fibArray[7]);
```

## Putting together the source of the application

For this part, reference the commit with finished source

## Dockerizing multiple portions of an application

### Dev Docker Containers

Its a good idea to build dev versions of the containers to validate everything
works well, even if we make changes, so that we dont have to rebuild images
anytime there is a change

The flow will generally be

    - Copy package.json
    - Run npm instlal
    - Copy over everything else
    - Docker Compose should set up a volume to share files

### Dev

The dev docker containers are pretty much identical to ones we have set up
before

### Setting up a big docker-compose

We're going to build in the postgres image, the redis image, and the entire
server

Some things to consider in a big compose file

Since we need a postgres and redis image we need to provide some details

And we need to provide builds, volumes and env variables to the server app

```yml
version: "3"

services:
  # set up a simple postgres service and launch it
  postgres:
    image: "postgres:latest"
    environment:
      - POSTGRES_PASSWORD=postgress_password
  # set up a simple redis instance and launch it
  redis:
    image: "redis:latest"
  # set up our server
  server:
    build:
      # use the dockerfile.dev in ./server
      dockerfile: dockerfile.dev
      context: ./server
    volumes:
      # dont fuck with this folder
      - /app/node_modules
      # replace the contents of app with everything in ./server
      - ./server:/app
```

there are two ways of setting up environment variables

`variableName=value` and `variableName`

in the former the value is explicitly set, in the latter the value is lifted
directly from your computer

having a variable lifted from your computer is useful when you have secrets to
protect, like keys

```yml
version: "3"

services:
  # set up a simple postgres service and launch it
  postgres:
    image: "postgres:latest"
    environment:
      # set up an env variable so that pg starts up properly
      - POSTGRES_PASSWORD=postgres_password
  # set up a simple redis instance and launch it
  redis:
    image: "redis:latest"
  # set up our server
  server:
    build:
      # use the dockerfile.dev in ./server
      dockerfile: dockerfile.dev
      context: ./server
    volumes:
      # dont fuck with this folder
      - /app/node_modules
      # replace the contents of app with everything in ./server
      - ./server:/app
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - PGUSER=postgres
      - PGHOST=postgres
      - PGDATABASE=postgres
      - PGPASSWORD=postgres_password
      - PGPORT=5432
```

### Wiring up the worker

```yml
version: "3"

services:
  # set up a simple postgres service and launch it
  postgres:
    image: "postgres:latest"
    environment:
      # set up an env variable so that pg starts up properly
      - POSTGRES_PASSWORD=postgres_password
  # set up a simple redis instance and launch it
  redis:
    image: "redis:latest"
  # set up our server
  server:
    build:
      # use the dockerfile.dev in ./server
      dockerfile: dockerfile.dev
      context: ./server
    volumes:
      # dont fuck with this folder
      - /app/node_modules
      # replace the contents of app with everything in ./server
      - ./server:/app
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - PGUSER=postgres
      - PGHOST=postgres
      - PGDATABASE=postgres
      - PGPASSWORD=postgres_password
      - PGPORT=5432
    worker:
      build:
        dockerfile: dockerfile.dev
        context: ./worker
      volumes:
        - /app/node_modules
        - ./worker:/app
      environment:
        - REDIS_HOST=redis
        - REDIS_PORT=6379
```

after setting up all elements without port mapping

```yml
version: "3"

services:
  # set up a simple postgres service and launch it
  postgres:
    image: "postgres:latest"
    environment:
      # set up an env variable so that pg starts up properly
      - POSTGRES_PASSWORD=postgres_password
  # set up a simple redis instance and launch it
  redis:
    image: "redis:latest"
  # set up our server
  api:
    build:
      # use the dockerfile.dev in ./server
      dockerfile: dockerfile.dev
      context: ./server
    volumes:
      # dont fuck with this folder
      - /app/node_modules
      # replace the contents of app with everything in ./server
      - ./server:/app
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - PGUSER=postgres
      - PGHOST=postgres
      - PGDATABASE=postgres
      - PGPASSWORD=postgres_password
      - PGPORT=5432
  worker:
    build:
      dockerfile: dockerfile.dev
      context: ./worker
    volumes:
      - /app/node_modules
      - ./worker:/app
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
  client:
    build:
      dockerfile: dockerfile.dev
      context: ./client
    volumes:
      - /app/node_modules
      - ./client:/app
```

## NGINX, and making it pay

so nginx is standing between everything in our app and the wide world

in this case we will have a dev environment leveraging nginx

with this app, the client is going to make file requests and route requests

we can use nginx to enforce routing -- files to the frontend, api to the backend

in the project all of our route handlers are prepended with `/api/` but the
server isnt set up to process the api route at all

nginx will let us filter network requests

if the req starts with api forward it to the express server if it starts without
api forward it to the frontend

being able to consolidate via nginx makes things simpler in prod and
orchestrating routes and serving shit

depending on environments ports may disappear so its an unnecessary liability

simpler to say that all api routes get directed to express

we will chop off `/api`

### Creating default.conf

the default.conf file will do the following

    - Tell nginx there is a server upstream at client:3000
    - Tell nginx there is a server upstream at server:5000
    - Listen on port 80 (inside the container)
    - Direct all requests at '/' to client
    - Direct all requests at '/api' to server

client and server are understandable urls within the context of docker in this

the file name and path are ./nginx/default.conf

```conf
# there is an upstream server called client
upstream client {
	# it is located here
	server client:3000;
}

upstream api {
	server api:5000;
}

# we want a server that listens on port 80
server {
	listen 80;

	# if you get a request on '/', forward it to the client
	location / {
		proxy_pass http://client;
	}

	location /api {
		# trim the path -- match the path and replace it with whatever is matched by the regex
		rewrite /api/(.*) /$1 break;
		proxy_pass http://api;
	}
}
```

### Making a custom nginx image

```dockerfile
FROM nginx
# overwrite the default.conf in /etc/nginx
COPY ./default.conf /etc/nginx/conf.d/default.conf
```

```yml
version: "3"

services:
  # nginx
  nginx:
    # always restart if you hit an error
    restart: always
    build:
      dockerfile: dockerfile.dev
      context: ./nginx
    ports:
      - "2021:80"
    depends_on:
      - api
      - client
  # set up a simple postgres service and launch it
  postgres:
    image: "postgres:latest"
    environment:
      # set up an env variable so that pg starts up properly
      - POSTGRES_PASSWORD=postgres_password
  # set up a simple redis instance and launch it
  redis:
    image: "redis:latest"
  # set up our server
  api:
    build:
      # use the dockerfile.dev in ./server
      dockerfile: dockerfile.dev
      context: ./server
    volumes:
      # dont fuck with this folder
      - /app/node_modules
      # replace the contents of app with everything in ./server
      - ./server:/app
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - PGUSER=postgres
      - PGHOST=postgres
      - PGDATABASE=postgres
      - PGPASSWORD=postgres_password
      - PGPORT=5432
  worker:
    build:
      dockerfile: dockerfile.dev
      context: ./worker
    volumes:
      - /app/node_modules
      - ./worker:/app
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
  client:
    build:
      dockerfile: dockerfile.dev
      context: ./client
    volumes:
      - /app/node_modules
      - ./client:/app
```

### Starting up docker compose

We got a websocket connection error which is our hot reload capability

fixing the issue

```yml
client:
  build:
    dockerfile: dockerfile.dev
    context: ./client
  environment:
    - WDS_SOCKET_PORT=0
  volumes:
    - /app/node_modules
    - ./client:/app
```

```conf
	# allow websocket connection
	location /ws {
		proxy_pass http://client;
		proxy_http_version 1.1;
		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection "Upgrade";
	}
```

## Multiple-image CI

### Building and deploying to EBS

The previous way of doing image builds on EBS was suboptimal

This time around we will use a slightly different deployment flow

    - Push code to github
    - Travis pulls the repo
    - Travis builds a test image and runs tests
    - Travis builds a prod image
    - Travis pushes prod images to docker hub
    - Travis pushes project to AWS EB
    - EB pulls images from Docker Hub and deploys them

Docker Hub is hugely important to the web infastructure, and AWS EB integrates
with Docker Hub very easily

We will basically notify EB there's new images from Docker Hub

The benefit is that we are now no longer dependent on EB to build our images

And once we push up to Docker Hub we can deploy anywhere

** Created production dockerfiles here... **

Building a react app and hosting it on an nginx proxy behind another nginx proxy

The core NGINX server is responsible strictly for routing

The production nginx server will be specifically hosting only the website and on
port 3000

The reason for using two copies of nginx is its more complete and a more
accurate representation of real world configurations

With this in mind it is really important to make sure that the nginx server
hosting the react app is configured to listen on port 3000 and not port 80

nginx conf

```conf
server {
	listen 3000;
	location / {
		root /usr/share/nginx/html;
		index index.html index.htm;
		try_files $uri $uri/ /index.html;
	}
}
```

dockerfile

```dockerfile
FROM node:16-alpine
WORKDIR '/app'
COPY ./package.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx
EXPOSE 3000
COPY ./nginx/default.conf etc/nginx/conf.d/default.conf
COPY --from=0 /app/build /usr/share/nginx/html
```

set up the app with travis ci here

### building the travis.yml file

    - Specify docker as a dependency
    - Build a test version of the react project
    - Run tests
    - Build prod versions of all projects
    - Push everything to docker hub
    - Tell EB to cycle

In this context we will only run tests for the react app but if you have tests
in other containers you could run them in parallel

```yml

```

**The below is deprecated because of AWS**

Dockerrun.aws.json is kind of like a docker-compose file

EBS actually has no idea how to run containers. It hands off most of the work to
Elastic Container Services via task definition files.

The Dockerrun kinda sucks so we need to look at Amazon ECS documentation of task
definitions instead

```json
{
  "AWSEBDockerrunVersion": "2",
  "containerDefinitions": [
    {
      "name": "client", // defining the name
      "image": "evgeniyp92/multi-client:latest",
      "hostname": "client", // setting up the port mapping and outlining it for AWS
      "essential": false // essential containers will cause a cascading shutdown on crash
    },
    {
      "name": "server",
      "image": "evgeniyp92/multi-server:latest",
      "hostname": "api",
      "essential": false
    },
    {
      "name": "worker",
      "image": "evgeniyp92/multi-worker:latest",
      "hostname": "worker",
      "essential": false
    },
    {
      "name": "nginx",
      "image": "evgeniyp92/multi-nginx:latest",
      "essential": true, // at least one container must be marked as true
      "portMappings": [
        {
          "hostPort": 80,
          "containerPort": 80
        }
      ],
      "links": ["client", "server"] // explicitly link nginx to the client and server
    }
  ]
}
```

We are not using the above file and instead using the new Amazon Linux 2 Platform

```dockerfile
version: "3"
services:
  client:
    image: "evgeniyp92/multi-client:latest"
    mem_limit: 128m
    hostname: client
  server:
    image: "evgeniyp92/multi-server:latest"
    mem_limit: 128m
    hostname: api
    environment:
      - REDIS_HOST=$REDIS_HOST
      - REDIS_PORT=$REDIS_PORT
      - PGUSER=$PGUSER
      - PGHOST=$PGHOST
      - PGDATABASE=$PGDATABASE
      - PGPASSWORD=$PGPASSWORD
      - PGPORT=$PGPORT
  worker:
    image: "evgeniyp92/multi-worker:latest"
    mem_limit: 128m
    hostname: worker
    environment:
      - REDIS_HOST=$REDIS_HOST
      - REDIS_PORT=$REDIS_PORT
  nginx:
    image: "evgeniyp92/multi-nginx:latest"
    mem_limit: 128m
    hostname: nginx
    ports:
      - "80:80"
```

Something that was overlooked was the redis and postgres database, which is by design

### AWS Deployment

#### Why you shouldn't use database containers

While using database containers is great for development, it is not a good idea
in prod

In the production instance, the elastic beanstalk instance will be hosting the 
main nginx proxy, the nginx hosting the frontend production files, the express 
server and the redis worker

Postgres and Redis will be running on AWS, via Elastic Cache and RDS

Using AWS services for ElasticCache over Redis is good because aws maintains
redis for you, it is super easy to scale, has built in logging and maintenance,
probably has much better security than what we can provide, and is easier to
migrate off of EB with if you want to change the hosting solution and methodology

Using RDS is better for all the same reasons as ElasticCache, with the added benefit
of automatic backups and rollbacks

Bottom line is, running RDS, ElasticCache, DDB is worth it because the monthly bill
for all of those services is maybe several dollars a month, whereas taking the time
to learn how to secure those elements and deploy them at the same level as AWS can
will take up a lot of time and work, which is going to be YOUR time and is going
to be far more valuable.

AWS still sucks ass to work with though

The next project will have self-managed redis and postgres but for now we're just
using the AWS services

### AWS VPC and Security Groups

There's some behind the scenes setup for AWS that requires some specialized knowledge

By default the EB instance can't talk with RDS and EC, so we have to create the link
in AWS

When we created our EBS app it was created in a very specific region. us-east-1
in our case

For each region we're in we get one default Virtual Private Cloud (VPC), which
is its own private little network

When we created our app it was assigned to our default VPC

To get our apps to talk to each other we need to create a security group, which
is just a fancy term for firewall rules.

For our EBS instance, one rule was created in the security group:
    - Allow any traffic across the world on port 80

But you can create any amount of security groups and rules you want

#### Creating a new security group

We are going to create a security group that allows any traffic from any other
aws service with the security group

#### RDS Creation

Create a new RDS database with a postgres engine, free tier, set the db identifier,
username, password. Define the instance config, assign to the default VPC, set
public access to no, create a new vpc security group, set the default database name, 
and hit go

#### Creating Elasticache

Create a redis cluster, follow the main obvious and cheap steps

#### Wiring everything up with a security group

Create a new security group with a clear name and description

Add inbound rules to the security group to allow any traffic inside the group

Then go and add all the relevant items to the security group

Add the security group to the redis/EC instance

Add the security group to the RDS instance as well

And finally add the security group to the EB environment containers as well

Once done, need to make sure our containers know how to reach RDS and EC with
environment variables

To add environment variables go to EBS and click on configuration -> software ->
environment properties

environment properties dont get hidden by default

 - REDIS_HOST=[redis elasticache instance](multi-docker-redis.rgcrwq.ng.0001.use1.cache.amazonaws.com:6379)
 - REDIS_PORT=6379
 - etc etc etc

when you configure environment variables in EBS the variables are available to 
all containers

we're going to modify out travis.yml file to push our docker-compose to the aws 
environment

we will need to create an IAM user to push the docker-compose to the aws environment

```yaml
sudo: required
language: generic
services:
  - docker

before_install:
  # in the case of the travis.yml file, the workdir is the yml file location
  - docker build -t evgeniyp92/react-test -f ./client/dockerfile.dev ./client

script:
  # run the test container
  - docker run -e CI=true evgeniyp92/react-test npm test

after_success:
  # build the images
  - docker build -t evgeniyp92/multi-client ./client
  - docker build -t evgeniyp92/multi-nginx ./nginx
  - docker build -t evgeniyp92/multi-server ./server
  - docker build -t evgeniyp92/multi-worker ./worker
  # retrieve the environment variable then emit it to the command on the right via stdin
  - echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_ID" --password-stdin
  # push the images to docker hub
  - docker push evgeniyp92/multi-client
  - docker push evgeniyp92/multi-nginx
  - docker push evgeniyp92/multi-server
  - docker push evgeniyp92/multi-worker

deploy:
  provider: elasticbeanstalk
  region: 'us-east-1'
  app: 'multi-docker'
  env: 'Multidocker-env'
  bucket_name: 'elasticbeanstalk-us-east-1-321861476458'
  bucket_path: 'docker-multi'
  on:
    branch: master
  access_key_id: $AWS_ACCESS_KEY
  secret_access_key: $AWS_SECRET_KEY
```

#### Setting memory limits in docker

AWS wants mem_limits defined for all of the containers in order not to complain

in the case of this application we gave everything 128 mb of memory

