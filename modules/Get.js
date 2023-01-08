const fs = require("fs");
const path = require("path");
const db = require("./../config/config").getConnection();
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

router.get('/tourguide/portfolio/view', checkAuth, (req, res) => {
  let userGuid = db.escape(req.userData.user_guid);
  let sql1 = `SELECT * FROM tour_guide WHERE user_guid = ${userGuid}`;
      let query1 = db.query(sql1, (err, result) => {
        if (err) {
          console.log(err);
          return res.status(500).json({
            message: "Some Error Occured in Checking",
          });
        }
        return res.status(200).json({
          message: "Success",
          data: result
        })
      })
})

// Tour Organization

router.get('/tourorg/portfolio/view', checkAuth, (req, res) => {
  let userGuid = db.escape(req.userData.user_guid);
  let sql1 = `SELECT * FROM tour_organization WHERE user_guid = ${userGuid}`;
      let query1 = db.query(sql1, (err, result) => {
        if (err) {
          console.log(err);
          return res.status(500).json({
            message: "Some Error Occured in Checking",
          });
        }
        return res.status(200).json({
          message: "Success",
          data: result
        })
      })
})


// traveler

router.get('/traveler/portfolio/view', checkAuth, (req, res) => {
  let userGuid = db.escape(req.userData.user_guid);
  let sql1 = `SELECT * FROM traveler WHERE user_guid = ${userGuid}`;
      let query1 = db.query(sql1, (err, result) => {
        if (err) {
          console.log(err);
          return res.status(500).json({
            message: "Some Error Occured in Checking",
          });
        }
        return res.status(200).json({
          message: "Success",
          data: result
        })
      })
})

// Package View

router.get('/package/view', checkAuth, (req, res) => {
  let userGuid = db.escape(req.userData.user_guid);
  let sql1 = `SELECT * FROM package WHERE user_guid = ${userGuid}`;
      let query1 = db.query(sql1, (err, result) => {
        if (err) {
          console.log(err);
          return res.status(500).json({
            message: "Some Error Occured in Checking",
          });
        }
        return res.status(200).json({
          message: "Success",
          data: result
        })
      })
})

module.exports = router;
