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

```dockercompose
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
