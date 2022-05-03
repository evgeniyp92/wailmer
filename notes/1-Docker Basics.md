# Docker Basics

## What is Docker?

Docker is a platform for running applications in containers. It is a
containerization engine that allows you to run applications on a virtual
machine.

When we get an image, we can run it in a container. Images are master files and
containers are instances of images.

A container is its own program that has its own isolated resources.

Docker is made up of the client/cli and the server.

We never touch the server so we'll mostly be interacting with the CLI.

You can check that docker is configured by running `docker version`

## Running our first commands

`docker run hello-world`

```
Hello from Docker!
This message shows that your installation appears to be working correctly.

To generate this message, Docker took the following steps:
 1. The Docker client contacted the Docker daemon.
 2. The Docker daemon pulled the "hello-world" image from the Docker Hub.
    (arm64v8)
 3. The Docker daemon created a new container from that image which runs the
    executable that produces the output you are currently reading.
 4. The Docker daemon streamed that output to the Docker client, which sent it
    to your terminal.
```

We started the docker client and communicated with the docker server. The server
could not find the image locally in the image cache. It then went to Docker Hub
and pulled down the hello-world image from there and put it in the image cache.
Once docker server had an image, it is ready to create containers. It loaded the
image into memory, created a container, and the container executed.

## What the heck is a container anyway

Containers are pretty much virtual machines running on your computer

They have a filesystem snapshot as well as a startup command

# Manipulating Containers with the Docker Client

## Creating and running a container from an image

`docker run [container_image]`

There's a lot of variations to the run command

`docker run [container_image] [command]` - Override the default command

`docker run busybox echo hi there` - Launches busybox and tells it to echo 'hi
there'

you can run any command that exists inside the image. so giving the ls command
will list the folders for busybox

you don't have the same command available for the hello-world image so it will
break if you try to call a program that doesnt exist

## Listing running containers

View running containers with `docker ps`

View all containers ever created and their run history with `docker ps --all`

## Container Lifecycle

Creating a container and starting a container are two different commands

`docker create` - sets up the container

`docker start` - execute the startup command

make sure to set the -a flag so that docker watches for output from the
container and forward it to your terminal

restart a container with `docker start` as well as the container id

NOTE: Once a container has been started for the first time and has a default
command that command is set in stone

delete containers with `docker system prune`

retrieve logs with `docker logs [container_id]`

stop containers with `docker stop` to ask politely and `docker kill` if you
weren't asking

some containers are multi-command containers

the redis image only launches redis-server when it runs, but to get access to
the cli you must run multiple commands

### Executing a second command inside a running container

to provide input to a container use `docker exec -it`

`docker exec -it 0dd43a4af270 redis-cli`

without setting `-it` redis-cli would launch but would just kick you back to
your command prompt

### The meaning of -it

In linux you have three main terminal channels of communication, STDIN, STDOUT,
and STDERR

your commands that you type are directed to STDIN

the process response is sent to STDOUT

errors are directed to STDERR

-it is made up of -i and -t

-i means everything we type goes to STDIN, and we see the STDOUT and STDERR

-t makes things look nice and presentable, and generally more usable

a common thing to do with docker containers is to get shell access inside them

### Getting shell in a docker container

`docker exec -it [container_id] sh`

sh is a pretty safe bet, in some cases you can also get access to bash or zsh

you can also immediately start up a shell when the container first starts

`docker run -it busybox sh`

this removes the startup command though, so be mindful

one particular thing about container behavior, is that each container has its
own filesystem and one is not accessible to another. there is no sharing of data
going on
