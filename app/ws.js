const express = require('express');

const router = express.Router();


router.post("/connect", (req, res) => {
  console.log(req);
  res.status(200);
  res.send("test");
});

router.post("/default", (req, res) => {
  console.log(req);
})

router.post("/disconnect", (req, res) => {
  console.log(req);
})