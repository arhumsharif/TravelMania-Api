const fs = require('fs');
const path = require('path');
const db = require('./../config/config').getConnection();
var md5 = require('md5');
const { v4: uuidv4 } = require('uuid');
const express = require('express');
const router = express.Router();
const checkAuth = require('../middleware/check-auth');
const { resolve } = require('path');
const { rejects } = require('assert');
const { error } = require('console');

router.get('/', (req, res) => {
  res.send('get Routes are working...');
  return;
});

router.get('/tourguide/portfolio/view', checkAuth, (req, res) => {
  let userGuid = db.escape(req.userData.user_guid);
  let sql1 = `SELECT * FROM tour_guide WHERE user_guid = ${userGuid}`;
  let query1 = db.query(sql1, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: 'Some Error Occured in Checking',
      });
    }
    return res.status(200).json({
      message: 'Success',
      data: result,
    });
  });
});

router.get('/tourguide/portfolio/view/:user_id', (req, res) => {
  let userGuid = db.escape(req.params.user_id);
  let sql1 = `SELECT * FROM tour_guide WHERE user_guid = ${userGuid}`;
  let query1 = db.query(sql1, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: 'Some Error Occured in Checking',
      });
    }
    return res.status(200).json({
      message: 'Success',
      data: result,
    });
  });
});

router.get('/tourorg/portfolio/view/:user_id', (req, res) => {
  let userGuid = db.escape(req.params.user_id);
  let sql1 = `SELECT * FROM tour_organization WHERE user_guid = ${userGuid}`;
  let query1 = db.query(sql1, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: 'Some Error Occured in Checking',
      });
    }
    return res.status(200).json({
      message: 'Success',
      data: result,
    });
  });
});

router.get('/package/specific/view/:package_id', (req, res) => {
  let packageGuid = db.escape(req.params.package_id);
  let sql1 = `SELECT * FROM package WHERE package_guid = ${packageGuid}`;
  let query1 = db.query(sql1, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: 'Some Error Occured in Checking',
      });
    }
    return res.status(200).json({
      message: 'Success',
      data: result,
    });
  });
});

// Tour Organization

router.get('/tourorg/portfolio/view', checkAuth, (req, res) => {
  let userGuid = db.escape(req.userData.user_guid);
  let sql1 = `SELECT * FROM tour_organization WHERE user_guid = ${userGuid}`;
  let query1 = db.query(sql1, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: 'Some Error Occured in Checking',
      });
    }
    return res.status(200).json({
      message: 'Success',
      data: result,
    });
  });
});

// traveler

router.get('/traveler/portfolio/view', checkAuth, (req, res) => {
  let userGuid = db.escape(req.userData.user_guid);
  let sql1 = `SELECT * FROM traveler WHERE user_guid = ${userGuid}`;
  let query1 = db.query(sql1, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: 'Some Error Occured in Checking',
      });
    }
    return res.status(200).json({
      message: 'Success',
      data: result,
    });
  });
});

// Package View

router.get('/package/view', checkAuth, (req, res) => {
  let userGuid = db.escape(req.userData.user_guid);
  let sql1 = `SELECT * FROM package WHERE user_guid = ${userGuid}`;
  let query1 = db.query(sql1, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: 'Some Error Occured in Checking',
      });
    }
    return res.status(200).json({
      message: 'Success',
      data: result,
    });
  });
});

router.get('/package/view/all', (req, res) => {
  let sql1 = `SELECT * FROM package`;
  let query1 = db.query(sql1, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: 'Some Error Occured in Checking',
      });
    }
    return res.status(200).json({
      message: 'Success',
      data: result,
    });
  });
});

router.get('/tourguide/view/all', (req, res) => {
  let sql1 = `SELECT * FROM tour_guide`;
  let query1 = db.query(sql1, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: 'Some Error Occured in Checking',
      });
    }
    return res.status(200).json({
      message: 'Success',
      data: result,
    });
  });
});

router.get('/tourorg/view/all', (req, res) => {
  let sql1 = `SELECT * FROM tour_organization`;
  let query1 = db.query(sql1, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: 'Some Error Occured in Checking',
      });
    }
    return res.status(200).json({
      message: 'Success',
      data: result,
    });
  });
});

// view help portal

router.get('/helpportal/view/all', (req, res) => {
  let sql1 = `SELECT * from help_portal;`;
  let query1 = db.query(sql1, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: 'Some Error Occured in Checking',
      });
    }
    return res.status(200).json({
      message: 'Success',
      data: result,
    });
  });
});

// get feedback

router.get('/feedback/view/:tourguideid', (req, res) => {
  let tourGuideGuid = db.escape(req.params.tourguideid);

  let sql1 = `SELECT f.* , u.email from feedback f INNER JOIN users u ON f.user_guid = u.user_guid WHERE f.tour_guide_guid = ${tourGuideGuid};`;
  let query1 = db.query(sql1, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: 'Some Error Occured in Checking',
      });
    }
    return res.status(200).json({
      message: 'Success',
      data: result,
    });
  });
});


module.exports = router;
