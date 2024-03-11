# A Complex Deployment with K8s

For complex deployments its good to have a folder in your project arch that
stores all the configs

## ClusterIP Service

ClusterIP exposes a set of pods to other objects in the cluster, which is good
for production. Pods, deployments and services can talk to each other but are
shielded from outside services touching them. We let the IngressService handle
inbound communication

Compare to NodePort which exposes pods to the outside world and shouldn't be
used except for in dev

The ClusterIP needs a port and a targetPort but does not need a NodePort, which
is for outside access anyway. Usually it's good enough to just forward port
mappings as is (3000:3000)

## Applying multiple files with Kubectl

You can apply multiple files by running `kubectl apply -f <folder-with-configs>`

## Colocating deployment configurations

You can consolidate config files into one by separating config items with `---`

It comes down to preference and how you want to think about your k8s deployment

Per-item config files are better for visual grepping and understanding the
project in the long run

```yaml
# server-config.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: server-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      component: server
  template:
    metadata:
      labels:
        component: server
    spec:
      containers:
        - name: server
          image: rallycoding/multi-server
          ports:
            - containerPort: 5000
---
apiVersion: v1
kind: Service
metadata:
  name: server-cluster-ip-service
spec:
  type: ClusterIP
  selector:
    component: server
  ports:
    - port: 5000
      targetPort: 5000
```

## Persistent Volume Claims

PVC's are basically volumes that are not ephemeral and persist through container
rebuilds

A volume in K8s is an object that allowes a container to store data at the
**POD** level

A Persistent Volume Claim and Persistent Volume is not a regular Volume to K8s

Volumes persist through container crashes but not pod issues

PVs and PVCs persist through pod and deployment issues

A PVC is effectively a ticket-granting ticket to get a statically or dynamically
provisioned persistent volume

## Volume Access Modes

- ReadWriteOnce - R/W by a single node
- ReadOnlyMany - R by many nodes
- ReadWriteMany - R/W by many nodes

in prod you need to do more work to figure out where your data is gonna be
stored

for AWS it will be EBS, and often it will be automatically configured by the
cloud provider

## Defining Environment Vars

(Reference commits)

## Secrets in K8s

we can run an imperative command to generate a secret, since it would be silly
to have a secret declared in config files

you also have to create the secret in the production environment when you deploy
to prod

`kubectl create secret [generic/docker-registry/tls] <secret_name> --from-literal key=value`

the secret gets created in the k8s environment

(of course everything broke, these projects are 5 years old)

## Load Balancers

Load Balancers in the world of K8s are a legacy way of getting network traffic
into a cluster. A load balancer provides service to a specific set of pods. We
have two sets of pods we want to expose to the outside world so an LB doesnt
fit. Also whenever we set up K8s a load balancer will be created thru your cloud
provider. Some would argue its deprecated but its not clear... Many ways to skin
a cat etc etc

## Configuring Ingress Servers

There are several implementations of an ingress, we will be using an nginx
ingress server

NB we are using `ingress-nginx`, a community project (led by K8s, endorsed and
backed by them too). We are **NOT** using `kubernetes-ingress`, a project led by
nginx.

Setup of ingress-nginx changes depending on your environment

In the course we're gonna set up local ingress and GC ingress

The ingress config is an object that has a set of config rules describing
traffic routing.

The ingress controller watches for changes to the ingress config and updates the
'thing' that handles traffic

And then we have the actual 'thing' that handles traffic -- the traffic router

In this particular project, the ingress controller and the traffic router is one
and the same -- nginx

## Google Cloud implementation

The ingress config will be fed to the controller and the nginx pod, but a
separate load balancer will be made for us. By default when nginx is set up a
default-backend pod will be set up for health checks and other things. Ideally
this should be replaced with an Express API server

You don't want to roll your own nginx load balancer because the custom project
has a lot of custom code that makes it aware it's in a k8s cluster.

One perk is that the community project can connect to specific pods and doesnt
have to go to the ClusterIP. This enables things like sticky sessions (?) and
other things.
