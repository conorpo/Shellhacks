// Import required modules
const express = require('express');
require("dotenv").config();

const https = require('https');
// const http = require('http');
const { initiate_call } = require("./call_manager.js");
const { readFileSync } = require('fs');
const { setup_call_listener } = require("./ws.js");
const { db_router } = require("./db.js")

const options = {
  key: readFileSync('./.ssl/privkey.pem'),
  cert: readFileSync('./.ssl/fullchain.pem')
};

function main() {
  const app = express();

  app.use(express.static('public', {

  }));



  // const wss = setup_call_listener(3001);

  app.listen(3000);

  //initiate_call({},"4074350184");
}
main()
