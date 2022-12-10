const fs = require("fs");
const path = require("path");
const db = require("./../config/config");
var md5 = require("md5");
const { v4: uuidv4 } = require("uuid");
const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");
const { resolve } = require("path");
const { rejects } = require("assert");
const { error } = require("console");

router.get("/", (req, res) => {
  res.send("get Routes are working...");
  return;
});

module.exports = router;
