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
