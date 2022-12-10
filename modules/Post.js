const fs = require("fs");
const md5 = require("md5");
const nodemailer = require("nodemailer");
const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const db = require("../config/config").getConnection();
const multer = require("multer");
const path = require("path");
const os = require("os");
const checkAuth = require("../middleware/check-auth");
const ampq = require("amqplib/callback_api");


router.post("/insert",(req,res)=> {

    let userGuid = db.escape(uuidv4());
    let email = db.escape(req.body.Email);
    let password = db.escape(req.body.Password);
    let userType = db.escape(req.body.UserType);
    let sql1 = `INSERT INTO users (user_guid, email, password, user_type, secret_key) VALUES (${userGuid}, ${email}, ${password}, ${userType}, '')`;
        let query1 = db.query(sql1, (err, result) => {
        if (err) {
            console.log(err)
            return res.status(500).json({
            message: "Some Error Occured in Checking Email",
            });
        }
    });
    return res.status(200).json({
        message: "Done!"
    })
});
module.exports = router;
