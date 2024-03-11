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

The ingress config will be fed to the controller and the nginx pod, but a
separate load balancer will be made for us. By default when nginx is set up a
default-backend pod will be set up for health checks and other things. Ideally
this should be replaced with an Express API server

You don't want to roll your own nginx load balancer because the custom project
has a lot of custom code that makes it aware it's in a k8s cluster.

One perk is that the community project can connect to specific pods and doesnt
have to go to the ClusterIP. This enables things like sticky sessions (?) and
other things.

link to set up ingress controller locally

```
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.0/deploy/static/provider/cloud/deploy.yaml
```

Now that the ingress is up the project is complete and we can move on

NB: There is a kubernetes dashboard available

`https://kubernetes.io/docs/tasks/access-application-cluster/web-ui-dashboard/`

### Raw Copypaste of the Docker Desktop Explainer from the course

```
This note is for students using Docker Desktop's built-in Kubernetes. If you are using Minikube, the setup here does not apply to you and can be skipped.

If you are using Docker Desktop's built-in Kubernetes, setting up the admin dashboard is going to take a little more work.

1. Grab the most current script from the install instructions:
https://kubernetes.io/docs/tasks/access-application-cluster/web-ui-dashboard/#deploying-the-dashboard-ui
eg:
As of today, the kubectl apply command looks like this:
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.5.0/aio/deploy/recommended.yaml

2. Create a dash-admin-user.yaml file and paste the following:

apiVersion: v1
kind: ServiceAccount
metadata:
  name: admin-user
  namespace: kubernetes-dashboard
3. Apply the dash-admin-user configuration:
kubectl apply -f dash-admin-user.yaml

4. Create dash-clusterrole-yaml file and paste the following:

apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: admin-user
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
  - kind: ServiceAccount
    name: admin-user
    namespace: kubernetes-dashboard

5. Apply the ClusterRole configuration:
kubectl apply -f dash-clusterrole.yaml

6. In the terminal, run kubectl proxy

You must keep this terminal window open and the proxy running!

7. Visit the following URL in your browser to access your Dashboard:
http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/

8. Obtain the token for this user by running the following in your terminal:

First, run kubectl version in a new terminal window.

If your Kubernetes server version is v1.24 or higher you must run the following command:

kubectl -n kubernetes-dashboard create token admin-user

If your Kubernetes server version is older than v1.24 you must run the following command:
kubectl -n kubernetes-dashboard get secret $(kubectl -n kubernetes-dashboard get sa/admin-user -o jsonpath="{.secrets[0].name}") -o go-template="{{.data.token | base64decode}}"

9. Copy the token from the above output and use it to log in at the dashboard.
Be careful not to copy any extra spaces or output such as the trailing % you may see in your terminal.

10. After a successful login, you should now be redirected to the Kubernetes Dashboard.

The above steps can be found in the official documentation:

https://github.com/kubernetes/dashboard/blob/master/docs/user/access-control/creating-sample-user.md
```

## Google Cloud implementation

-- Skipped, not relevant and likely outdated

## HTTPS on K8s

General steps:

Create an A and CNAME record that point to the ip address of the purchased
domain

`@-A-1H-<ipv4>` `www-CNAME-1H-<domain-name.com>`

Next, install cert-manager `https://cert-manager.io/docs/installation/`

Create a Certificate object and Issuer object

```yaml
# https://docs.cert-manager.io/en/latest/tasks/issuers/setup-acme/index.html#creating-a-basic-acme-issuer
# Issuer -- issuer.yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  # tell the issuer to reach out to letsencrypt
  name: letsencrypt-prod
spec:
  acme:
    # server to hit
    server: https://acme-v02.api.letsencrypt.org/directory
    # should be your personal email -- LE requirement
    email: 'test@test.com'
    privateKeySecretRef:
      # helper name for the exchange process
      name: letsencrypt-prod
    solvers:
      - http01:
        ingress:
          class: nginx
```

```yaml
# https://cert-manager.io/docs/tutorials/acme/http-validation/#issuing-an-acme-certificate-using-http-validation
# Certificate -- certificate.yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: yourdomain-com-tls
spec:
  secretName: yourdomain-com
  issuerRef:
    # make sure these match the issuer.yaml
    name: letsencrypt-prod
    kind: ClusterIssuer
  commonName: yourdomain.com
  dnsNames:
    - yourdomain.com
    - www.yourdomain.com
```

cert-manager automatically finds these files and runs everything

Last step is to reconfigure the ingress (after certificate retrieved)

```yaml
# ingress-serice.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ingress-service
  annotations:
    nginx.ingress.kubernetes.io/use-regex: 'true'
    # decouple routing to server
    nginx.ingress.kubernetes.io/rewrite-target: /$1
    # specify the cluster issuer
    cert-manager.io/cluster-issuer: letsencrypt-prod
    # force https
    nginx.ingress.kubernetes.io/ssl-redirect: 'true'
spec:
  # tls configuration
  tls:
    - hosts:
        - myapp.com
        - www.myapp.com
      secretName: yourdomain-com-tls
  ingressClassName: nginx
  rules:
    - host: myapp.com
      http:
        paths:
          - path: /?(.*)
            pathType: ImplementationSpecific
            backend:
              service:
                name: client-cluster-ip-service
                port:
                  number: 3000
          - path: /api/?(.*)
            pathType: ImplementationSpecific
            backend:
              service:
                name: server-cluster-ip-service
                port:
                  number: 5000
    - host: www.myapp.com
      http:
        paths:
          - path: /?(.*)
            pathType: ImplementationSpecific
            backend:
              service:
                name: client-cluster-ip-service
                port:
                  number: 3000
          - path: /api/?(.*)
            pathType: ImplementationSpecific
            backend:
              service:
                name: server-cluster-ip-service
                port:
                  number: 5000
```

If `kubectl get certificates` gives no result, creating and deploying the
ingress manifest should fix it
