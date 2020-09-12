# A simple node JS example

The application `app/app.js` shows how to inject keys and certificate in a node program.

We require to set some environment variables:

```bash
export CAS_ADDR="4-2-1.scone-cas.cf" # we use a public SCONE CAS to store the session policies
export IMAGE="sconecuratedimages/apps:node-10.14-alpine"
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

