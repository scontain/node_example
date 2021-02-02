# A simple node JS example

## Run on an Azure Kubernetes Cluster

To run on Azure Kubernetes Service (AKS) with Kubernetes, begin by setting up helm. You will require access to the SconeAppsEE repository.
```bash
export GH_TOKEN=...
helm repo add sconeappsEE https://${GH_TOKEN}@raw.githubusercontent.com/scontain/SconeAppsEE/master/
helm repo update
```

Now we continue by installing the [SCONE LAS](https://sconedocs.github.io/helm_las/). Be sure to set select the node you wish to use using the `nodeSelector`, analogous to this example:
```bash
# label the node we wish to use
kubectl label nodes aks-confcompool1-32092211-vmss000000 sgx=target

# install the LAS
helm install las sconeappsEE/las \
    --set useSGXDevPlugin=azure \
    --set sgxEpcMem=16 \
    --set nodeSelector.sgx=target \
    --set image=registry.scontain.com:5050/sconecuratedimages/services:las-scone4.2.1
```


Continue by uploading a session, using the same scripts as before:
```bash
export CAS_ADDR="4-2-1.scone-cas.cf" # we use a public SCONE CAS to store the session policies
export IMAGE="sconecuratedimages/apps:node-10.14-alpine-scone4.2.1"
unset NODE_SESSION
export NODE_SESSION=$(./upload_session --template=nodejs-template.yml --session=nodejs-session.yml  --image=$IMAGE --cas=$CAS_ADDR)
```

Now we can deploy the NodeJS example. Be sure to deploy it on the same node as your LAS:
```bash
helm install nodejs nodejs \
        --set useSGXDevPlugin=azure \
        --set sgxEpcMem=16 \
        --set scone.attestation.ConfigID=$NODE_SESSION/app \
        --set nodeSelector.sgx=target
```

To access the application, follow the instructions printed out upon deploying the helm chart:
```bash
# 1. Get the application URL by running these commands:
export POD_NAME=$(kubectl get pods --namespace default -l "app.kubernetes.io/name=nodejs,app.kubernetes.io/instance=nodejs" -o jsonpath="{.items[0].metadata.name}")
export CONTAINER_PORT=$(kubectl get pod --namespace default $POD_NAME -o jsonpath="{.spec.containers[0].ports[0].containerPort}")
echo "Visit http://127.0.0.1:8080 to use your application"
kubectl --namespace default port-forward $POD_NAME 8080:$CONTAINER_PORT
```

The **Client Request** instructions can be followed analogous to running the service locally, with the exception of replacing the port `443` with the port `8080`.

## Run locally with Docker

The application `app/app.js` shows how to inject keys and certificate in a node program.

We require to set some environment variables:

```bash
export CAS_ADDR="4-2-1.scone-cas.cf" # we use a public SCONE CAS to store the session policies
export IMAGE="sconecuratedimages/apps:node-10.14-alpine-scone4.2.1"
unset NODE_SESSION
export NODE_SESSION=$(./upload_session --template=nodejs-template.yml --session=nodejs-session.yml  --image=$IMAGE --cas=$CAS_ADDR)
export DEVICE=$(./determine_sgx_device) # determine the SGX device of the local computer
```

and then run locally by executing

```bash
docker-compose up
```

This will print some log messages and eventually print

```txt
node_1  | Example tls app start!
node_1  | read the secret :Hello NodeJS
node_1  | Example tls app listening on port 443!
node_1  | scone mode is :Hello NodeJS
node_1  | Ok.
```

indicating that the `app` is ready to process requests.

## Client Request

Execute client request via https:

```bash
curl -k https://localhost:443
```

The output will be:

```text
Hello World!Hello NodeJS
```

Note that '-k' is the insecure mode and if we drop this option, the output will look like this:

```txt
curl https://localhost:443

curl: (60) SSL certificate problem: unable to get local issuer certificate
More details here: https://curl.haxx.se/docs/sslcerts.html

curl failed to verify the legitimacy of the server and therefore could not
establish a secure connection to it. To learn more about this situation and
how to fix it, please visit the web page mentioned above.
```

Let's fix this by removing the warning and also attesting the node service.


## Get CA Certificate used to sign certificate of node app

Retrieve the exported ca certificate with curl from CAS and store in file ca-cert

````bash
export ca_cert=$(curl -k https://${CAS_ADDR}:8081/v1/values/session=$NODE_SESSION | jq ".values.api_ca_cert.value" | tr -d \" )
printf "\n$ca_cert" > ca_cert
```

```bash
curl --capath "$(pwd)" --cacert ca_cert --verbose https://app:443 --resolve app:443:127.0.0.1
```


## Notes

Before restarting the service, please shut it down properly with `docker-compose up`. Also execute `unset NODE_SESSION` to ensure that you do not reuse an old session afterwards.

You need to ensure that CAS executes inside of an enclave and was not manipulated. To do so, you would need to use
our SCONE CLI to [attest CAS](https://sconedocs.github.io/helm_cas/#attesting-cas) and to [upload a session](https://sconedocs.github.io/CAS_cli/#createupdate-session-description)
