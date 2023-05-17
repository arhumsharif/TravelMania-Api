const fs = require('fs');
const md5 = require('md5');
const nodemailer = require('nodemailer');
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../config/config').getConnection();
const multer = require('multer');
const path = require('path');
const os = require('os');
const checkAuth = require('../middleware/check-auth');
const ampq = require('amqplib/callback_api');

// Send Mail
const sendConfirmation = (receiver, subject, text) => {
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'arhumsharif06@gmail.com',
      pass: 'otslwknoqspbdsue',
    },
  });

  var mailOptions = {
    from: 'arhumsharif06@gmail.com',
    to: receiver,
    subject: subject,
    text: text,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
};

// @route  /admin/get/req/tourguide
// @desc   Admin to get the request for the new tour guides
// @access restricted
// @method GET
router.get('/get/req/tourguide', checkAuth, (req, res) => {
  let query = `SELECT * FROM req_tour_guide WHERE confirmed = 0`;
  let queryRes = db.query(query, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: 'Server Error',
      });
    }
    return res.status(200).json({
      message: 'Success',
      data: result,
    });
  });
});

// @route  /admin/get/help/queries
// @desc   Admin to get the help queries
// @access restricted
// @method GET
router.get('/get/help/queries', checkAuth, (req, res) => {
  let query = `SELECT * FROM help_portal ORDER BY date_created DESc`;
  let queryRes = db.query(query, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: 'Server Error',
      });
    }
    return res.status(200).json({
      message: 'Success',
      data: result,
    });
  });
});

// @route  /admin/get/req/tourorg
// @desc   Admin to get the request for the new tour guides
// @access restricted
// @method GET
router.get('/get/req/tourorg', checkAuth, (req, res) => {
  let query = `SELECT * FROM req_tour_org WHERE confirmed = 0`;
  let queryRes = db.query(query, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: 'Server Error',
      });
    }
    return res.status(200).json({
      message: 'Success',
      data: result,
    });
  });
});

// @route  /admin/get/req/tourguide/:id
// @desc   Admin to get the request for a specific new tour guides
// @access restricted
// @method GET
router.get('/get/req/tourguide/:id', checkAuth, (req, res) => {
  let id = db.escape(req.params.id);
  let query = `SELECT * FROM req_tour_guide WHERE req_guid = ${id} AND confirmed = 0`;
  let queryRes = db.query(query, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: 'Server Error',
      });
    }
    return res.status(200).json({
      message: 'Success',
      data: result,
    });
  });
});

// @route  /admin/get/req/tourorg/:id
// @desc   Admin to get the request for a specific new tour guides
// @access restricted
// @method GET
router.get('/get/req/tourorg/:id', checkAuth, (req, res) => {
  let id = db.escape(req.params.id);
  let query = `SELECT * FROM req_tour_org WHERE req_guid = ${id} AND confirmed = 0`;
  let queryRes = db.query(query, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: 'Server Error',
      });
    }
    return res.status(200).json({
      message: 'Success',
      data: result,
    });
  });
});

// @route  /admin/post/success
// @desc   Admin to get the request for a specific new tour guides
// @access restricted
// @method GET
router.post('/post/success', checkAuth, (req, res) => {
  let user_guid = db.escape(req.body.req_guid);
  let email = db.escape(req.body.email);
  let password = db.escape(req.body.password);
  let table = req.body.table;
  let userType = db.escape(req.body.user_type);
  let sql = `INSERT INTO users (user_guid, email, password, user_type, secret_key) VALUES(${user_guid}, ${email}, ${password}, ${userType}, '')`;
  let query = db.query(sql, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: 'Server Error',
      });
    }

    let sql2 = `DELETE FROM ${table} WHERE req_guid = ${user_guid}`;
    console.log(sql2);
    let query2 = db.query(sql2, (err2, result2) => {
      if (err2) {
        console.log(err2);
        return res.status(500).json({
          message: 'Server Error',
        });
      }
    });

    sendConfirmation(
      req.body.email,
      'Confirmation From Travelmania',
      'Your request have been approved you may login using your credentials'
    );

    return res.status(200).json({
      message: 'Success',
    });
  });
});

// @route  /admin/post/success
// @desc   Admin to get the request for a specific new tour guides
// @access restricted
// @method GET
router.post('/post/failure', checkAuth, (req, res) => {
  let user_guid = db.escape(req.body.req_guid);
  let email = req.body.email;
  let table = req.body.table;
  let sql = `DELETE FROM ${table} WHERE req_guid = ${user_guid}`;
  let query = db.query(sql, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: 'Server Error',
      });
    }

    sendConfirmation(
      req.body.email,
      'Confirmation From Travelmania',
      'We are sorry your request have been rejected currently'
    );

    return res.status(200).json({
      message: 'Success',
    });
  });
});

module.exports = router;
