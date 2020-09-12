var express = require('express');
const https = require("https"),
fs = require("fs");

console.log('Example tls app start!');
console.log('read the secret :'+process.env.GREETING)

const keyFilePath = '/tls/key.pem';
const certFilePath = '/tls/cert.pem';


var privateKey  = fs.readFileSync(keyFilePath, 'utf8');
var certificate = fs.readFileSync(certFilePath, 'utf8');

var credentials = {key: privateKey, cert: certificate};

var app = express();
var httpsServer = https.createServer(credentials, app);


app.get('/', function (req, res) {
  console.log('scone mode is :'+process.env.GREETING)
  res.send('Hello World!' + process.env.GREETING);
});

httpsServer.listen(443, function () {
  console.log('Example tls app listening on port 443!');
  console.log('scone mode is :'+process.env.GREETING)
  console.log('Ok.');
});


