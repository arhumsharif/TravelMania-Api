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


router.post("/user/add", (req, res) => {
    let userGuid = db.escape(uuidv4());
    let email = db.escape(req.body.Email);
    let password = db.escape(md5(req.body.Password));
    let userType = db.escape(req.body.UserType);
  
    // Got the attributes from front end
    // Check if a user exists with same email
    let promiseOne = new Promise((resolve, reject) => {
      let sql1 = `SELECT * FROM users WHERE email = ${email}`;
      let query1 = db.query(sql1, (err, result) => {
        if (err) {
          console.log(err);
          return res.status(500).json({
            message: "Some Error Occured in Checking Email",
          });
        }
        if (result.length > 0) {
          reject("Invalid Email");
        }
        resolve(result);
      });
    });
    promiseOne.then(
      (data) => {
        // No Email Found With this Email
        let sql2 = `INSERT INTO users (user_guid, email, password, user_type, secret_key) VALUES(${userGuid},${email},${password},${userType},'')`;
        let query2 = db.query(sql2, (err1, result1) => {
          if (err1) {
            console.log(err1)
            return res.status(500).json({
              message: "Some Error Occured in Inserting Data",
            });
          }
    
          return res.status(200).json({
            message: "Success",
          });
        });
      },
      (error) => {
        // Email Found with given Email
        return res.status(500).json({
          message: error,
        });
      }
    );
  });

  // add a portfolio of tour guide

  router.post('/tourguide/portfolio/add', checkAuth, (req, res) => {

    let tourguideGuid = db.escape(uuidv4());
    let userGuid = db.escape(req.userData.user_guid);
    let name = db.escape(req.body.Name)
    let age = db.escape(req.body.Age)
    let gender = db.escape(req.body.Gender)
    let cnic = db.escape(req.body.Cnic)
    let phone = db.escape(req.body.Phone)
    let city = db.escape(req.body.City)
    let country = db.escape(req.body.Country)
    let about = db.escape(req.body.About)

    let promiseOne = new Promise((resolve, reject) => {
      let sql1 = `SELECT * FROM tour_guide WHERE user_guid = ${userGuid}`;
      let query1 = db.query(sql1, (err, result) => {
        if (err) {
          console.log(err);
          return res.status(500).json({
            message: "Some Error Occured in Checking",
          });
        }
        if (result.length > 0) {
          reject("Update");
        }
        resolve("Insert");
      });
    });
    promiseOne.then(
      (data) => {
        // Gonna Insert
        let sql2 = `INSERT INTO tour_guide (tour_guide_guid, user_guid, name, age, gender, cnic, country, phone_no, city, about) VALUES (${tourguideGuid}, ${userGuid}, ${name}, ${age}, ${gender}, ${cnic}, ${country}, ${phone}, ${city}, ${about})`;
        let query2 = db.query(sql2, (err1, result1) => {
          if (err1) {
            console.log(err1)
            return res.status(500).json({
              message: "Some Error Occured in Inserting Data",
            });
          }
    
          return res.status(200).json({
            message: "Inserted",
          });
        });
      },
      (data) => {
        // Gonna Update
        let sql2 = `UPDATE tour_guide SET name = ${name}, age = ${age}, gender = ${gender}, cnic = ${cnic}, country = ${country}, phone_no = ${phone}, city = ${city}, about = ${about} WHERE user_guid = ${userGuid}`;
        let query2 = db.query(sql2, (err1, result1) => {
          if (err1) {
            console.log(err1)
            return res.status(500).json({
              message: "Some Error Occured in Updating Data",
            });
          }

        return res.status(200).json({
          message: 'Updated',
        });
      })
      }
    );
  })

module.exports = router;
