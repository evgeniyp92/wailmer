# Kubernetes

## Why and what

In the case of complex, how would you scale it up?

If you suddenly had a lot of demand for the application, how would you respond?

The worker was the component of our app that would have handled by far the most
work, so it makes sense that we would want to scale it

In the world of elastic beanstalk scaling an individual component just doesn't
happen

Instead of creating multiple copies of one specific container EBS clones the
entire dockerfile and creates new copies of everything in the dockerfile

Kubernetes could have been used to solve tihs

A K8s cluster consists of a master and nodes. The master controls what each node
does, with the nodes themselves being vm's or physical computers that run
different sets of containers and its completely arbitrary. The Master is the
orchestrator of everything

The master has a set of programs that control what the nodes are running

We communicate with the master to achieve our end goals of meeting performance
demands

An important aspect of K8s if proper configuration of load balancers

## K8s in dev and prod

K8s only makes sense if we have different types of containers that we need to
run over multiple machines

- Use minikube in development
- Use ECS/EKS for Kubernetes, Google Kubernetes Engine or do it yourself in prod

The managed solutions are better for starting out, but K8s will give you tighter
control of your costs and resources as applications get bigger

### What is minikube

Minikube creates a vm to run containers on our local machine

We then use kubectl to interact with our k8s cluster

minikube falls away when we move off dev but kubectl will be available in prod

### Update

Docker desktop actually supports Kubernetes on macOS now

minikube commands can be ignored and the ip address for visiting resources will
now be `localhost`

## Mapping existing knowledge

`kubectl cluster-info` to see that status of K8s

Short term goal is to get the multi-client image running on our local K8s
cluster running as a container

### In the case of Docker

- In our docker-compose files we described how docker-compose should build an
  image
- One entry per container we want to create
- Each entry defines the networking requirements (port mapping)

### In the case of kubernetes

- K8s expects the images to already be built
- One config file per _object_ we want to create
- Must set up all networking manually, without any config helpers

### Steps to get a simple container running on our K8s cluster

- Host the image on Docker Hub
- Make one config file to create the container
- Make one config file to set up networking

the 8 in k8s stands for the amount of letters between k and s in kubernetes

## Creating a config file

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: client-pod
  labels:
    component: web
spec:
  containers:
    - name: client
      image: stephengrider/multi-client
      ports:
        - containerPort: 3000
```

## Creating a network file

```yaml
apiVersion: v1
kind: Service
metadata:
  name: client-node-port
spec:
  type: NodePort
  ports:
    - port: 3050
      targetPort: 3000
      nodePort: 31515
  selector:
    component: web
```

## What this all means

`apiVersion` limits what set of object types we can use

Config files in general are used to create objects, and the `kind` tag describes
what kind of object you're making. Each object serves a different purpose, like
running and monitoring containers, networking, etc

- Service - sets up networking
- Pod - runs a container
- ReplicaController
- StatefulSet
- ComponentStatus
- ConfigMap
- Event
- Endpoints
- Namespace

Usually you're just gonna decide what you wanna make and figure out the
apiVersion based on that, i.e. you gotta use `apiVersion` 1 if you want to make
a Pod. Its a reactionary feature in nature.

### What's a Pod?

You can't just create a container on a cluster in K8s, you must create a pod to
enclose it

Node/VM -> Pod/Container Group -> Container

A Pod is a grouping of containers that all have a common purpose, or are
interdependent on each other and must be running together. This means containers
that, if one crashes, the other cannot continue in any way shape or form.

A pod with a postgres container and a notional logger and backup-manager is a
good implementation example. If postgres goes down, the logger and
backup-manager are useless, so it makes sense to group them.

We don't have any tightly integrated containers so will not be grouping
containers in pods

`spec/containers` describes the name, image and linked ports of the containers.
this example is not exhaustive however.

### What's a Service

**Services set up networking in K8s Clusters**

Subtypes of services

- ClusterIP: Covered later
- NodePort: Exposes a port to the world (don't use in prod, only in dev! (with a
  few exceptions))
- LoadBalancer: Covered later
- Ingress: Covered later

When you make a request, it hits the `kube-proxy`, which then forwards the
request to the NodePort service, which should have a coupling and route to a
container inside a pod

```yaml
# client-node-port.yaml
spec:
  type: NodePort
  ports:
    # direct all traffic to these ports (see lower)
    - port: 3050 # port for other pods/containers to use to access a pod
      targetPort: 3000 # port the pod selected uses to talk in/out
      nodePort: 31515 # port for servicing http requests from outside (30000-32767, randomly assigned if not specified)
  selector:
    # label-selector system
    # maps to the container with a label of component:web in its metadata
    component: web
```

### Loading stuff into K8s

#### Feeding config files to K8s

`kubectl apply -f <filename>`

`apply` is a keyword to change the current config of our cluster

`-f` specify a file

`kubectl get pods` get information about all pods

`kubectl get services` get info about all services

NB if you were running Minikube you'd need to ask for the IP of the VM created
by Minikube `minikube ip`

### Detailed breakdown of what happened with the deploys

K8s automatically revives dead/crashed containers

Too much to cover, just rewatch the video

Kube-apiserver is a program dedicated to health and behavior monitoring of nodes

the master has a list of how many containers of what kind are running and should
be running, and orchestrates multiple nodes, each of which have docker, which do
their docker thing on their own. master regularly keeps an eye that there's
enough containers running across all nodes and acts to fix any discrepancies

## Takeaways

- K8s is a system to deploy containerized apps
- Nodes are individual machines (physical or virtual) that run containers
- Masters are machines with a set of programs to manage nodes
- K8s does not build images
- K8s decides on its own where to run each container by default (although we can
  instruct it)
- To deploy something, we update the desired state of the master with a config
  file
- The master works constantly to meet the desired state

### Approaches to deployment

- Imperative
  - Do exactly these steps to arrive at this container setup
- Declarative
  - I want x, make it happen

_Kubernetes gives you the tools to do things both ways_

However in this course we'll be trying to use declarative deployment as much as
possible, because that's the only approach that makes sense in prod
