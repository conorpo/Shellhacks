// Import required modules
const express = require('express');
const { readFileSync } = require('fs');
require("dotenv").config();

const { initiate_call } = require("./call_manager.js");
const { setup_call_listener } = require("./ws.js");

const { router } = require("../api/router.js");

// const options = {
//   key: readFileSync('./.ssl/privkey.pem'),
//   cert: readFileSync('./.ssl/fullchain.pem')
// };

function main() {
  const app = express();

  app.use(express.json());
  app.use("/api", router);
  app.use(express.static('public', {

  }));
  
  app.listen(3000);
  const wss = setup_call_listener(3001);
  
 // initiate_call({ companyName: "Mathnasium", description: "Math Tutoring", objectives:"Recruit Kids, Book a Call", opener:"Hi my name is Samantha from Mathnasium."},"4073414243");
  // initiate_call({},"4073414243");
}
main()
