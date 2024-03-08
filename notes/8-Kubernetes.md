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
run

- Use minikube in development
- Use ECS/EKS for Kubernetes, GKE or do it yourself in prod

The managed solutions are better for starting out

### What is minikube

Minikube creates a vm to run containers on our local machine

We then use kubectl to interact with our k8s cluster

minikube falls away when we move off dev but kubectl will be available in prod

### Update

Docker desktop actually supports Kubernetes on macOS now

minikube commands can be ignored and the ip address for visiting resources
will now be `localhost`

## Mapping existing knowledge

Short term goal is to get the multi-client image running on our local K8s
cluster running as a container

- In our docker-compose files we described how docker-compose should build an
  image
- Each entry in the d-c represents a container we want to create
- Each entry defines the networking requirements (port mapping)

In the case of kubernetes

- K8s expects the images to already be built
- One config file per _object_ we want to create
- Must set up all networking manually

Steps to get a simple container running on our K8s cluster

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
