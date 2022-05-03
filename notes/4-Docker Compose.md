# Docker Compose and Multiple Containers

We'll be setting up a website with a hit counter

Because of this we need containers for the node app and the redis server

We can only have one redis server to maintain data uniformity

#### package.json

```javascript
{
  "dependencies": {
    "express": "*",
    "redis": "2.8.0"
  },
  "scripts": {
    "start": "node index.js"
  }
}
```

#### index.js

```javascript
const express = require('express');
const redis = require('redis');

const app = express();

const client = redis.createClient();
client.set('visits', 0);

app.get('/', (req, res) => {
  client.get('visits', (err, visits) => {
    res.send('Number of visits: ' + (visits || 0));
    client.set('visits', parseInt(visits + 1));
  });
});

app.listen(8081, () => {
  console.log(`Listening on port 8081`);
});
```

built the image with `docker build -t evgeniyp92/visits:latest . `

if we start up the redis server and try to connect we cannot, because there are
no ports exposed and the two containers generally have no way of communicating
between each other

We can either bring up networking via the Docker CLI, or we can use **Docker
Compose**

## What the heck is Docker Compose

Its a special additional tool that gets installed alongside with docker

Its a separate cli to docker.

Ultimately, it exists to automate some of the long winded arguments that we've
been passing to docker run

It also makes starting multiple containers at the same time very easy

## Adding a Docker Compose file

There is a special syntax in which to write out the yml file

### Steps of docker compose for this project

- Create two containers
  - redis-server
    - pull this down from Docker Hub
  - node-app
    - make it with the dockerfile in current directory
    - map port 8081 to 8081

```yml
version: '3'

# service means we are defining two services,
# which take the form of containers
services:
  # redis
  redis-server:
    # pull it from docker hub
    image: 'redis'
  # node app
  node-app:
    # use the dockerfile to build it
    build: .
    # expose the port
    ports:
      - '4001:8081'
```

mapping ports only exposes them to our local machine, containers can still talk
to each other via docker compose network magic

```javascript
const client = redis.createClient({
  host: 'redis-server',
  port: 6379,
});
client.set('visits', 0);
```

## Running Docker Compose

`docker run myimage` == `docker-compose up`

`docker build .` + `docker run myimage` == `docker-compose up --build`

launch multiple containers in the background with `docker-compose up -d`

## Stopping Docker Compose container

Stop containters with `docker-compose down`

## Maintaining containers with Compose

you can provide a restart policy to containers

levels:

- "no" - don't try to
- always - try if the container stops for any reason
- on-failure - try if the container sends a non-zero exit code
- unless-stopped - always restart unless forcibly stopped

you can run `docker-compose ps` and it will tell you the status of relevant
containers on your machine that belong to the given docker-compose file
