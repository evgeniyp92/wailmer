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
