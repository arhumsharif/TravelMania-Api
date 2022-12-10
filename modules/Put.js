const fs = require("fs");
const md5 = require("md5");
const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const db = require("../config/config")
const checkAuth = require("../middleware/check-auth");
// test Result
router.get("/", (req, res) => {
  res.send("Put is working...");
});

module.exports = router;
