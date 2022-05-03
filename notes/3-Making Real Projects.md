# Making real projects with Docker

The goal will be to make a tiny node js web app, dockerizing it, and accessing
it from localhost

We will be making some intentional mistakes in our project which we will see and
fix

## Setting up the app

#### package.json

```json
{
  "dependencies": {
    "express": "*"
  },
  "scripts": {
    "start": "node index.js"
  }
}
```

#### index.js

```javascript
const express = require('express');

const app = express();

app.get('/', (req, res) => {
  res.send('Hello, world!');
});

app.listen(8080, () => {
  console.log(`Server listening on port 8080`);
});
```

#### Dockerfile - 1st draft (with errors!)

```Dockerfile
# Alpine Linux base image
FROM alpine

# Get all required npm packages
RUN npm install

# Set the start command for the server
CMD ["npm", "start"]
```

## Issues with the dockerfile

### NPM: Not found

We are getting this because we're using the alpine base image, which does not
come with node or npm

Alpine linux is extremely small, which is good but dont expect to do a lot with
it out of the box

There are two options to resolve this:

- Find a different image
- Install nodejs as a RUN command

Alpine is a term in the docker community for an image stripped down to its bare
essentials

#### Dockerfile - 2nd draft

```Dockerfile
# Alpine Linux base image
FROM node:14-alpine

# Get all required npm packages
RUN npm install

# Set the start command for the server
CMD ["npm", "start"]
```

### Node: no package.json

The files in our root did not get copied into the image, by default

The solution is to copy the build files

```Dockerfile
# Copy everything to the current container
COPY ./ ./
```

#### Dockerfile - 3rd draft

```Dockerfile
# Alpine Linux base image
FROM node:14-alpine

# Copy everything to the current container
COPY ./ ./

# Get all required npm packages
RUN npm install

# Set the start command for the server
CMD ["npm", "start"]
```

### Browser: Can't access the page

the browser is trying to make a request to port 8080, but by default the
container and your computer are completely isolated

so you need to open ports and map them to allow inbound connections to the
docker container

the container can reach out as much as it needs however

port forwarding is a runtime constraint

#### docker run with port mapping

`docker run -p 8080:8080 evgeniyp92:tinynode`

keep in mind that ports need not be identical between external and internal

### All the files were copied into the root of the filesystem in Docker

change the current work directory to a non-root location

it doesnt matter too much where you put your application files, but /usr/app is
pretty safe

### We've got unnecessary rebuilds

Changes we make in the project arent always refreshed inside the container

If we make one change we have to rebuild the entire container

Because of that every step after file copy can no longer be fetched from the
cache and now we're burning bandwidth and time regenerating images

Since `npm install` only needs the package.json we can change our Dockerfile
flow to maximize using the cache

```Dockerfile
# Alpine Linux base image
FROM node:14-alpine

# Set the cwd to the project root
WORKDIR /usr/app

# Copy package.json to the current container
COPY ./package.json ./package.json

# Get all required npm packages
RUN npm install

# Copy everything else
COPY ./index.js ./index.js

# Set the start command for the server
CMD ["npm", "start"]
```

In this above config, we maximize how much we use the cache and minimize
rebuilds
