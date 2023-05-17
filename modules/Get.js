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

router.get('/package/desc/:package_id', (req, res) => {
  let packageGuid = db.escape(req.params.package_id);
  let sql1 = `SELECT * FROM package_description WHERE package_guid = ${packageGuid} ORDER BY day ASC`;
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
  let sql1 = `SELECT p.*, AVG(f.rating) as 'Rating', COUNT(f.rating) as 'Number' FROM package p LEFT JOIN feedback f ON p.package_guid = f.entity_guid GROUP BY p.package_guid HAVING p.user_guid = ${userGuid}`;
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
  let sql1 = `SELECT p.*, AVG(f.rating) as 'Rating', COUNT(f.rating) as 'Number' FROM package p LEFT JOIN feedback f ON p.package_guid = f.entity_guid GROUP BY p.package_guid;`;
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


router.get('/traveler/profile/view', checkAuth, (req, res) => {
  let userGuid = db.escape(req.userData.user_guid)
  let sql1 = `SELECT p.*, b.booking_date FROM booking b INNER JOIN package p ON p.package_guid = b.package_guid WHERE b.traveler_guid = ${userGuid};`;
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


router.get('/organizer/profile/view', checkAuth, (req, res) => {
  let userGuid = db.escape(req.userData.user_guid)
  let sql1 = `SELECT p.*, b.booking_date, b.traveler_guid, b.booking_guid, u.email from booking b INNER JOIN package p ON b.package_guid = p.package_guid INNER JOIN users u ON b.traveler_guid = u.user_guid WHERE p.user_guid = ${userGuid};`;
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

// chat view

router.get('/chat/view/:receiverid', checkAuth, (req, res) => {
  let senderGuid = db.escape(req.userData.user_guid);
  let receiverGuid = db.escape(req.params.receiverid);
  let promise = new Promise((resolve, reject) => {

    let sql1 = `SELECT * FROM inbox WHERE (sender_guid = ${senderGuid} and receiver_guid = ${receiverGuid}) OR (sender_guid = ${receiverGuid} and receiver_guid = ${senderGuid}) ORDER BY date_created ASC`;
    let query1 = db.query(sql1, (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json({
          message: 'Some Error Occured in Checking',
        });
      }
      resolve(result)
    })

  });
  promise.then((data) => {
    
    let sql2 = `SELECT email from users WHERE user_guid = ${receiverGuid}`;
    let query2 = db.query(sql2, (err1, result1) => {
      if (err1) {
        console.log(err1);
        return res.status(500).json({
          message: 'Some Error Occured in Getting email',
        });
      }

      return res.status(200).json({
        message: 'Success',
        moreData: result1,
        data: data,
      });
    })
  }, (err) => {
    return res.status(500).json({
      message: 'Some Error Occured in Checking',
    });
  })
});

// get feedback

router.get('/feedback/view/:packageid', (req, res) => {
  let entityGuid = db.escape(req.params.packageid);

  let sql1 = `SELECT f.* , u.email from feedback f INNER JOIN users u ON f.user_guid = u.user_guid WHERE f.entity_guid = ${entityGuid};`;
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


router.get('/chats',checkAuth , (req, res) => {
  let userGuid = db.escape(req.userData.user_guid);

  let sql1 = `SELECT user_guid, email, user_type FROM users WHERE user_guid != ${userGuid};`;
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
