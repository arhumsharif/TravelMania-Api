const fs = require("fs");
const md5 = require("md5");
const nodemailer = require("nodemailer");
var aws = require("aws-sdk");
const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const db = require("../config/config")
const multer = require("multer");
const path = require("path");
const os = require("os");
const checkAuth = require("../middleware/check-auth");
const ampq = require("amqplib/callback_api");

module.exports = router;
