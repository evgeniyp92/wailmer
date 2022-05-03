# Making custom Docker images

The process for making images is pretty straightforward

We're gonna make a Dockerfile that we're going to provide to the client, which
will then talk with the server to generate a usable image

## Dockerfile flow

- Specify a base image
- Run some commands to install additional programs
- Specify a command to run on container startup

The goal of our first one is to make an image that will run redis-server

```dockerfile
# Use an existing Docker image as a base
FROM alpine

# Download and install a dependency
RUN apk add --update redis

# Tell the image what to do when started as a container
CMD ["redis-server"]
```

Once the dockerfile has been made we can run `docker build .`

we used a bunch of stuff to config the dockerfile

### FROM

Instruction to specify what base image to use

### RUN

Instruction to specify what commands should be run to prepare the image

### CMD

Instruction to specify what command should be run when a container is launched

--

Writing a dockerfile is kind of like being given a computer with no OS and being
told to install Chrome

We use alpine as a base image because alpine suits the needs of docker
containers

When we ran `docker build .` we handed off our Dockerfile to the docker cli

In the command the . refers to not just the location but the entire build
context

during the build process we generate a lot of intermediate containers that do
the steps we need it to

in this context, when we passed `RUN apk add --update redis` that was the launch
command for the intermediate container. the filesystem snapshot then gets passed
down to the next intermediate container for further operations, until we get to
the end of the dockerfile, at which point we have our fully generated image

## Rebuilds with cache

Intermediate images are tagged and kept with cache so when you modify a
dockerfile the only time-expensive operations are the ones that are new, already
existing ones are fetched with cache

As a rule, try to put changing elements as low in the dockerfile as possible

## Tagging images

tag images with -t

i.e. `-t evgeniyp92/wailmer:latest`

`docker build -t evgeniyp92/wailmer-redis:latest .`

technically the version number is the actual tag, but the general process is
called tagging

## Generating images manually with Docker Commit

You can create an image out of a container too if you are so inclined

You can boot up a blank container and set everything up, then use docker commit
to save the image

`docker run -it alpine sh`

`apk add --update redis`

(in another window) `docker commit -c 'CMD ["redis-server"]' [container_id]`

fun fact, you dont have to copy the entire sha256 string for docker to id what
container youre pointing to

using docker commit is not ideal, but you can build images out of containers if
you want
