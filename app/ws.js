const express = require('express');

const ws_router = express.Router();



ws_router.post("/connect", (req, res) => {
  console.log("CONNECT: ");

  
  res.status(200);
  res.send("test");
});

ws_router.post("/default", (req, res) => {
  console.log("DEFAULT: ");

  console.log(req.body.event, req.body.media);
})

ws_router.post("/disconnect", (req, res) => {
  console.log("DISCONNECT: ");
})

module.exports = { ws_router };