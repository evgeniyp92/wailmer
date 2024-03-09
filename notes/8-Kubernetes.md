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
- Deployment - maintains a set of identical pods, ensuring they have the correct
  configs and that there are the right number of them
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

### Declarative updates to configuration

Instead of tearing down the nodes and building them back up we can just update
the config file and pass it to k8s while things are running. The Master will
find the existing object and figure out the new updates

#### Putting multi-worker onto K8s

Old goal: Get the multi-client image running on local k8s as a container

New goal: Update our existing pod to use the multi-worker image

#### Inspecting pods and containers on k8s

`kubectl describe <object type> <object name>` - prints out tons of info on an
object

```
❯ kubectl describe pods client-pod
Name:             client-pod
Namespace:        default
Priority:         0
Service Account:  default
Node:             docker-desktop/192.168.65.3
Start Time:       Sat, 09 Mar 2024 11:42:05 +0100
Labels:           component=web
Annotations:      <none>
Status:           Running
IP:               10.1.0.7
IPs:
  IP:  10.1.0.7
Containers:
  client:
    Container ID:   docker://9cd8ec3cf1bf16dcae2f8c28b7401d7fd2c056cc0bde2a772e97a5d0f1a6ccbb
    Image:          stephengrider/multi-worker
    Image ID:       docker-pullable://stephengrider/multi-worker@sha256:5fbab5f86e6a4d499926349a5f0ec032c42e7f7450acc98b053791df26dc4d2b
    Port:           3000/TCP
    Host Port:      0/TCP
    State:          Running
      Started:      Sat, 09 Mar 2024 11:48:01 +0100
    Last State:     Terminated
      Reason:       Completed
      Exit Code:    0
      Started:      Sat, 09 Mar 2024 11:42:07 +0100
      Finished:     Sat, 09 Mar 2024 11:47:53 +0100
    Ready:          True
    Restart Count:  1
    Environment:    <none>
    Mounts:
      /var/run/secrets/kubernetes.io/serviceaccount from kube-api-access-xcwz2 (ro)
Conditions:
  Type                        Status
  PodReadyToStartContainers   True
  Initialized                 True
  Ready                       True
  ContainersReady             True
  PodScheduled                True
Volumes:
  kube-api-access-xcwz2:
    Type:                    Projected (a volume that contains injected data from multiple sources)
    TokenExpirationSeconds:  3607
    ConfigMapName:           kube-root-ca.crt
    ConfigMapOptional:       <nil>
    DownwardAPI:             true
QoS Class:                   BestEffort
Node-Selectors:              <none>
Tolerations:                 node.kubernetes.io/not-ready:NoExecute op=Exists for 300s
                             node.kubernetes.io/unreachable:NoExecute op=Exists for 300s
Events:
  Type    Reason     Age                   From               Message
  ----    ------     ----                  ----               -------
  Normal  Scheduled  8m58s                 default-scheduler  Successfully assigned default/client-pod to docker-desktop
  Normal  Pulling    8m57s                 kubelet            Pulling image "stephengrider/multi-client"
  Normal  Pulled     8m56s                 kubelet            Successfully pulled image "stephengrider/multi-client" in 1.329s (1.329s including waiting)
  Normal  Killing    3m10s                 kubelet            Container client definition changed, will be restarted
  Normal  Pulling    3m10s                 kubelet            Pulling image "stephengrider/multi-worker"
  Normal  Created    3m2s (x2 over 8m56s)  kubelet            Created container client
  Normal  Started    3m2s (x2 over 8m56s)  kubelet            Started container client
  Normal  Pulled     3m2s                  kubelet            Successfully pulled image "stephengrider/multi-worker" in 8.419s (8.419s including waiting)
```

### Illegal updates to k8s pods

K8s catches and will refuse to make updates it considers illegal. It gives you
detailed printouts of what goes wrong and what you are allowed to do.

### Deployments

With a pod:

- Run a single set of containers
- Good for one-off dev purposes
- Rarely used in prod

With a deployment:

- Run n sets of identical pods, monitoring each and updating as necessary
- Good for dev
- Good for producterino

We will not be using pods much anymore and will instead use deployments

### Deleting objects

`kubectl delete -f <file>`

this command is imperative in nature, and cant really be helped

(applied the deployment to k8s here)

`kubectl get deployments`

### Services and why to use them

When pods get blown away there is no guarantee they will come back with the same
ip. Services take care of that by declaring mappings to pods that are not based
on ips

### Caveats around updating deployments in prod
