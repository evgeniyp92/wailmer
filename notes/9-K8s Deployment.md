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
