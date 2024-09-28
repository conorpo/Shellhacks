// Import required modules
const express = require('express');
require("dotenv").config();

const https = require('https');
// const http = require('http');
const { initiate_call } = require("./call_manager.js");
const { readFileSync } = require('fs');

// Start the Express server
const options = {
    key: readFileSync("./.ssl/client-key.pem"),
    cert: readFileSync("./.ssl/client-cert.pem")
};

function main() {
  const app = express();

  app.use(express.static('public', {

  }));

  
  const server = https.createServer(options, app).listen(443);

  //initiate_call({},"4074350184");
}
main()
