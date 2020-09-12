# A simple node JS example

The application `app/app.js` shows how to inject keys and certificate in a node program.

We require to set some environment variables:

```bash
export CAS_ADDR="4-2-1.scone-cas.cf" # we use a public SCONE CAS to store the session policies
export IMAGE="sconecuratedimages/apps:node-14-alpine"
unset NODE_SESSION
export NODE_SESSION=$(./upload_session --template=nodejs-template.yml --session=nodejs-session.yml  --image=$IMAGE --cas=$CAS_ADDR)
export DEVICE=$(./determine_sgx_device) # determine the SGX device of the local computer
```

and then run locally by executing

```bash
docker-compose --file docker-compose-node.yml up
```

## Client Request

Execute client request via http:

```bash
curl -k localhost:443
```

The output will be:

```text
Hello World!Hello NodeJS
```

## Get CA Certificate used to sign certificate of node app

Retrieve the exported ca certificate with curl and store in file ca-cert.pem

````bash
export ca_cert=$(curl -k https://${CAS_ADDR}:8081/v1/values/session=$NODE_SESSION | jq ".values.api_ca_cert.value")
printf "ca_cert=$ca_cert"
```

## Notes

You need to ensure that CAS executes inside of an enclave and was not manipulated. To do so, you would need to use
our SCONE CLI to [attest CAS](https://sconedocs.github.io/helm_cas/#attesting-cas) and to [upload a session](https://sconedocs.github.io/CAS_cli/#createupdate-session-description)