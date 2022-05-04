# Creating a repeatable development workflow

_Generated a react app with CRA_

## Using a custom dockerfile to build the app

`docker build -f [custom_file] .`

`docker run -p 3000:3000 -d [image_id]`

## Setting up docker volumes

we can use a docker volume to allow us to dev out of our docker container

we will put a reference to our actual dev files in the docker container

setting up docker volumes can sometimes be a pain

`docker run -p 3000:3000 -v /app/node_modules -v $(pwd):/app [image_id]`

^ puts a bookmark on node_modules and forwards current working directory on
physical machine to the app folder in the container

without putting a bookmark on node_modules it wont chooch, because we dont have
a node_modules in our computer folder, so the node_modules folder in the
container got overwritten

using the -v flag on a folder tells docker not to fuck with it

## Shorthand with Docker Compose

this is all well and good but these commands are getting really long

docker-compose is here to help make our life easier

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
```

now that you have a link back from the container to your local machine you can
delete the `COPY . .`, but its not really worth it

it's a nice fallback if you decide to drop docker-compose

## Running tests

This simply involves generating the image, then overriding the default command
with `npm run test` and setting up interactive terminal (-it) if you want to
interact with it

Problem is if we make changes to the test suite it wont be reflected until we
regenerate the image

Without having volumes set up we're testing the code as it was when we generated
the image

We could create a second service in docker-compose but there's another way

If we bring up the set with docker-compose we can attach to the existing
container, then execute our command to start the test suite

`docker exec -it [container_id] npm run test`

This isnt the best solution cause youre going to have to handjam that every time

Another way would be adding a second service to the docker-compose

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

The issue is that with an attached prompt we dont get an interactive prompt and
it looks like a mess

We can attach to an existing container from another terminal window, but we wont
be able to interact with it. Unfortunately, that's as good as it gets

We can't attach directly because the process running our tests isnt the same one
that we gave the original command to, and we can't attach to the child process

So we can either execute docker-compose if we dont care about interactivity, or
spawn the main container and use `docker exec` on it

## Nginx and multistep containers

When a react app is built we dont need the dev server anymore, we need a simple
web server thats going to server our built website

We will use nginx to set up our built website

We'll use node:alpine, copy package.json, install deps, run npm run build, and
start nginx

Problem is we only need the deps to do the build, and its a lot of deps. Also
where the hell are we getting nginx from

It would be really great if we could have two base images, so we can build a
multistep dockerfile with a build phase and a run phase

We will start alpine node to build the website, then use nginx as a base to copy
over the result of npm run build and start nginx

```dockerfile
FROM node:16.15-alpine as builder
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
RUN ["npm", "run", "build"]

# new FROM statements terminate the preceding block
FROM nginx as server
# copy /app/build from the builder image to the default nginx share dir
COPY --from=builder /app/build /usr/share/nginx/html
# since the default nginx container command is to start we dont have to worry about that
```
