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
version: '3'

services:
  # set up a simple postgres service and launch it
  postgres:
    image: 'postgres:latest'
    environment:
      - POSTGRES_PASSWORD=postgress_password
  # set up a simple redis instance and launch it
  redis:
    image: 'redis:latest'
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
version: '3'

services:
  # set up a simple postgres service and launch it
  postgres:
    image: 'postgres:latest'
    environment:
      # set up an env variable so that pg starts up properly
      - POSTGRES_PASSWORD=postgres_password
  # set up a simple redis instance and launch it
  redis:
    image: 'redis:latest'
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
version: '3'

services:
  # set up a simple postgres service and launch it
  postgres:
    image: 'postgres:latest'
    environment:
      # set up an env variable so that pg starts up properly
      - POSTGRES_PASSWORD=postgres_password
  # set up a simple redis instance and launch it
  redis:
    image: 'redis:latest'
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
version: '3'

services:
  # set up a simple postgres service and launch it
  postgres:
    image: 'postgres:latest'
    environment:
      # set up an env variable so that pg starts up properly
      - POSTGRES_PASSWORD=postgres_password
  # set up a simple redis instance and launch it
  redis:
    image: 'redis:latest'
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
version: '3'

services:
  # nginx
  nginx:
    # always restart if you hit an error
    restart: always
    build:
      dockerfile: dockerfile.dev
      context: ./nginx
    ports:
      - '2021:80'
    depends_on:
      - api
      - client
  # set up a simple postgres service and launch it
  postgres:
    image: 'postgres:latest'
    environment:
      # set up an env variable so that pg starts up properly
      - POSTGRES_PASSWORD=postgres_password
  # set up a simple redis instance and launch it
  redis:
    image: 'redis:latest'
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

## Starting up docker compose

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
