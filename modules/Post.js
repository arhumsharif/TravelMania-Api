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

function generateOTP() {
  // Generate a random 4-digit number
  const otp = Math.floor(Math.random() * 10000);

  // If the number is less than 1000, add leading zeros
  if (otp < 1000) {
    return ('0' + otp).slice(-4);
  } else {
    return otp.toString();
  }
}

// Send Confirmation of Registration
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

router.post('/user/add', (req, res) => {
  let userGuid = db.escape(uuidv4());
  let email_send = req.body.Email;
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
          message: 'Server Error',
        });
      }
      if (result.length > 0) {
        reject('Invalid Credentials');
      }
      resolve(result);
    });
  });
  promiseOne.then(
    (data) => {
      // No Email Found With this Email
      let otpcode = generateOTP();

      let sql2 = `INSERT INTO users (user_guid, email, password, user_type, secret_key, otp_code) VALUES(${userGuid},${email},${password},${userType},'', ${otpcode})`;
      let query2 = db.query(sql2, (err1, result1) => {
        if (err1) {
          console.log(err1);
          return res.status(500).json({
            message: 'Server Error',
          });
        }

        sendConfirmation(
          email_send,
          'Confirmation From Travelmania',
          'Your Otp Code is: ' + otpcode
        );

        return res.status(200).json({
          message: 'Success',
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

router.post('/requser/add', (req, res) => {
  let userGuid = db.escape(uuidv4());
  let email = db.escape(req.body.Email);
  let password = db.escape(md5(req.body.Password));
  let name = db.escape(req.body.name);
  let cnic = db.escape(req.body.cnic);
  let mobile = db.escape(req.body.mobile);
  let dob = db.escape(req.body.dob);
  let address = db.escape(req.body.address);

  // Got the attributes from front end
  // Check if a user exists with same email
  let promiseOne = new Promise((resolve, reject) => {
    let sql1 = `SELECT * FROM users WHERE email = ${email}`;
    let query1 = db.query(sql1, (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json({
          message: 'Server Error',
        });
      }
      if (result.length > 0) {
        reject('Invalid Credentials');
      }
      resolve(result);
    });
  });
  promiseOne.then(
    (data) => {
      // No Email Found With this Email
      let sql2 = `INSERT INTO req_tour_guide (req_guid, name, cnic, mobile, dob, address, email, password, confirmed) VALUES(${userGuid},${name},${cnic},${mobile},${dob}, ${address}, ${email}, ${password}, 0)`;
      let query2 = db.query(sql2, (err1, result1) => {
        if (err1) {
          console.log(err1);
          return res.status(500).json({
            message: 'Server Error',
          });
        }

        return res.status(200).json({
          message: 'Success',
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

router.post('/requserorg/add', (req, res) => {
  let userGuid = db.escape(uuidv4());
  let email = db.escape(req.body.Email);
  let password = db.escape(md5(req.body.Password));
  let o_name = db.escape(req.body.o_name);
  let o_reg_no = db.escape(req.body.o_reg_no);
  let o_phone = db.escape(req.body.o_phone);
  let o_web = db.escape(req.body.o_web);
  let o_address = db.escape(req.body.o_address);
  let name = db.escape(req.body.name);
  let cnic = db.escape(req.body.cnic);
  let mobile = db.escape(req.body.mobile);
  let dob = db.escape(req.body.dob);

  // Got the attributes from front end
  // Check if a user exists with same email
  let promiseOne = new Promise((resolve, reject) => {
    let sql1 = `SELECT * FROM users WHERE email = ${email}`;
    let query1 = db.query(sql1, (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json({
          message: 'Server Error',
        });
      }
      if (result.length > 0) {
        reject('Invalid Credentials');
      }
      resolve(result);
    });
  });
  promiseOne.then(
    (data) => {
      // No Email Found With this Email
      let sql2 = `INSERT INTO req_tour_org (req_guid, email, o_name, o_reg_no, o_phone, o_web, o_address, name, cnic, mobile, dob, password, confirmed) VALUES(${userGuid}, ${email}, ${o_name}, ${o_reg_no}, ${o_phone}, ${o_web}, ${o_address}, ${name}, ${cnic}, ${mobile}, ${dob}, ${password}, 0)`;
      let query2 = db.query(sql2, (err1, result1) => {
        if (err1) {
          console.log(err1);
          return res.status(500).json({
            message: 'Server Error',
          });
        }

        return res.status(200).json({
          message: 'Success',
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

router.post('/user/verify', (req, res) => {
  let email = db.escape(req.body.Email);
  let otpCode = db.escape(req.body.OtpCode);

  let sql1 = `SELECT * FROM users WHERE email = ${email} and otp_code = ${otpCode}; `;
  let query1 = db.query(sql1, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: 'Some Error Occured in Checking',
      });
    }

    if (result.length <= 0) {
      return res.status(400).json({
        message: 'Failed',
      });
    }

    return res.status(200).json({
      message: 'Success',
    });
  });
});

// add a portfolio of tour guide

router.post('/tourguide/portfolio/add', checkAuth, (req, res) => {
  let tourguideGuid = db.escape(uuidv4());
  let userGuid = db.escape(req.userData.user_guid);
  let name = db.escape(req.body.Name);
  let age = db.escape(req.body.Age);
  let gender = db.escape(req.body.Gender);
  let cnic = db.escape(req.body.Cnic);
  let phone = db.escape(req.body.Phone);
  let city = db.escape(req.body.City);
  let country = db.escape(req.body.Country);
  let about = db.escape(req.body.About);

  let promiseOne = new Promise((resolve, reject) => {
    let sql1 = `SELECT * FROM tour_guide WHERE user_guid = ${userGuid}`;
    let query1 = db.query(sql1, (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json({
          message: 'Some Error Occured in Checking',
        });
      }
      if (result.length > 0) {
        reject('Update');
      }
      resolve('Insert');
    });
  });
  promiseOne.then(
    (data) => {
      // Gonna Insert
      let sql2 = `INSERT INTO tour_guide (tour_guide_guid, user_guid, name, age, gender, cnic, country, phone_no, city, about) VALUES (${tourguideGuid}, ${userGuid}, ${name}, ${age}, ${gender}, ${cnic}, ${country}, ${phone}, ${city}, ${about})`;
      let query2 = db.query(sql2, (err1, result1) => {
        if (err1) {
          console.log(err1);
          return res.status(500).json({
            message: 'Some Error Occured in Inserting Data',
          });
        }

        return res.status(200).json({
          message: 'Inserted',
        });
      });
    },
    (data) => {
      // Gonna Update
      let sql2 = `UPDATE tour_guide SET name = ${name}, age = ${age}, gender = ${gender}, cnic = ${cnic}, country = ${country}, phone_no = ${phone}, city = ${city}, about = ${about} WHERE user_guid = ${userGuid}`;
      let query2 = db.query(sql2, (err1, result1) => {
        if (err1) {
          console.log(err1);
          return res.status(500).json({
            message: 'Some Error Occured in Updating Data',
          });
        }

        return res.status(200).json({
          message: 'Updated',
        });
      });
    }
  );
});

// tour organization

router.post('/tourorg/portfolio/add', checkAuth, (req, res) => {
  let tourorgGuid = db.escape(uuidv4());
  let userGuid = db.escape(req.userData.user_guid);
  let name = db.escape(req.body.Name);
  let country = db.escape(req.body.Country);
  let contact = db.escape(req.body.Contact);
  let phone = db.escape(req.body.Phone);
  let about = db.escape(req.body.About);

  console.log(country);

  let promiseOne = new Promise((resolve, reject) => {
    let sql1 = `SELECT * FROM tour_organization WHERE user_guid = ${userGuid}`;
    let query1 = db.query(sql1, (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json({
          message: 'Some Error Occured in Checking',
        });
      }
      if (result.length > 0) {
        reject('Update');
      }
      resolve('Insert');
    });
  });
  promiseOne.then(
    (data) => {
      // Gonna Insert
      let sql2 = `INSERT INTO tour_organization (tour_org_guid, user_guid, org_name, country, primary_contact, phone_no, about) VALUES (${tourorgGuid}, ${userGuid}, ${name}, ${country}, ${contact}, ${phone}, ${about})`;
      let query2 = db.query(sql2, (err1, result1) => {
        if (err1) {
          console.log(err1);
          return res.status(500).json({
            message: 'Some Error Occured in Inserting Data',
          });
        }

        return res.status(200).json({
          message: 'Inserted',
        });
      });
    },
    (data) => {
      // Gonna Update
      let sql2 = `UPDATE tour_organization SET org_name = ${name}, country = ${country}, primary_contact = ${contact}, phone_no = ${phone}, about = ${about} WHERE user_guid = ${userGuid}`;
      let query2 = db.query(sql2, (err1, result1) => {
        if (err1) {
          console.log(err1);
          return res.status(500).json({
            message: 'Some Error Occured in Updating Data',
          });
        }

        return res.status(200).json({
          message: 'Updated',
        });
      });
    }
  );
});

// Traveler
// tour organization

router.post('/traveler/portfolio/add', checkAuth, (req, res) => {
  let travelerGuid = db.escape(uuidv4());
  let userGuid = db.escape(req.userData.user_guid);
  let name = db.escape(req.body.Name);
  let phone = db.escape(req.body.Phone);
  let cnic = db.escape(req.body.Cnic);
  let language = db.escape(req.body.Language);
  let dob = db.escape(req.body.Dob);
  let gender = db.escape(req.body.Gender);
  let city = db.escape(req.body.City);
  let country = db.escape(req.body.Country);
  let about = db.escape(req.body.About);

  console.log(dob);

  let promiseOne = new Promise((resolve, reject) => {
    let sql1 = `SELECT * FROM traveler WHERE user_guid = ${userGuid}`;
    let query1 = db.query(sql1, (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json({
          message: 'Some Error Occured in Checking',
        });
      }
      if (result.length > 0) {
        reject('Update');
      }
      resolve('Insert');
    });
  });
  promiseOne.then(
    (data) => {
      // Gonna Insert
      let sql2 = `INSERT INTO traveler (traveler_guid, user_guid, name, phone, cnic, language, dob, gender, city, country, about) VALUES (${travelerGuid}, ${userGuid}, ${name}, ${phone}, ${cnic}, ${language}, ${dob}, ${gender}, ${city}, ${country}, ${about})`;
      let query2 = db.query(sql2, (err1, result1) => {
        if (err1) {
          console.log(err1);
          return res.status(500).json({
            message: 'Some Error Occured in Inserting Data',
          });
        }

        return res.status(200).json({
          message: 'Inserted',
        });
      });
    },
    (data) => {
      // Gonna Update
      let sql2 = `UPDATE traveler SET name = ${name}, phone = ${phone}, cnic = ${cnic}, language = ${language}, gender = ${gender}, city = ${city}, country = ${country}, about = ${about} WHERE user_guid = ${userGuid}`;
      let query2 = db.query(sql2, (err1, result1) => {
        if (err1) {
          console.log(err1);
          return res.status(500).json({
            message: 'Some Error Occured in Updating Data',
          });
        }

        return res.status(200).json({
          message: 'Updated',
        });
      });
    }
  );
});

// Package Insert
router.post('/package/add', checkAuth, (req, res) => {
  let packageGuid = db.escape(uuidv4());
  let userGuid = db.escape(req.userData.user_guid);
  let title = db.escape(req.body.Title);
  let desc = db.escape(req.body.Desc);
  let place = db.escape(req.body.Place);
  let hotel = db.escape(req.body.Hotel);
  let price = db.escape(req.body.Price);
  let capacity = db.escape(req.body.Capacity);
  let image_url = db.escape(req.body.ImageURL);

  let sql1 = `INSERT INTO package (package_guid, user_guid, title, description, place, hotel, price, image_url, capacity) VALUES (${packageGuid}, ${userGuid}, ${title}, ${desc}, ${place}, ${hotel}, ${price}, ${image_url}, ${capacity})`;
  let query1 = db.query(sql1, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: 'Some Error Occured in Checking',
      });
    }
    return res.status(200).json({
      message: 'Success',
      package_guid: packageGuid,
    });
  });
});

// Package description add
router.post('/package/desc/add', (req, res) => {
  console.log('ksjda');
  let packageDescGuid = db.escape(uuidv4());
  let packageGuid = db.escape(req.body.Guid);
  let time = db.escape(req.body.Time);
  let event = db.escape(req.body.Event);
  let day = db.escape(req.body.Day);

  let sql1 = `INSERT INTO package_description (package_desc_guid, package_guid, time, event, day) VALUES (${packageDescGuid}, ${packageGuid}, ${time}, ${event}, ${day})`;
  let query1 = db.query(sql1, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: 'Some Error Occured in Checking',
      });
    }
    return res.status(200).json({
      message: 'Success',
    });
  });
});

// add  portal

router.post('/helpportal/add', (req, res) => {
  let helpPortalGuid = db.escape(uuidv4());
  let name = db.escape(req.body.Name);
  let email = db.escape(req.body.Email);
  let title = db.escape(req.body.Title);
  let desc = db.escape(req.body.Desc);

  let sql1 = `INSERT INTO help_portal (help_portal_guid, name, email, title, description) VALUES (${helpPortalGuid}, ${name}, ${email}, ${title}, ${desc})`;
  let query1 = db.query(sql1, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: 'Some Error Occured in Checking',
      });
    }
    return res.status(200).json({
      message: 'Success',
    });
  });
});

// add feedback

router.post('/feedback/add', checkAuth, (req, res) => {
  let feedbackGuid = db.escape(uuidv4());
  let userGuid = db.escape(req.body.userGuid);
  let entityGuid = db.escape(req.body.EntityGuid);
  let entityType = db.escape(req.body.EntityType);
  let desc = db.escape(req.body.Desc);
  let rating = db.escape(req.body.Rating);

  let sql1 = `INSERT INTO feedback (feedback_guid, user_guid, entity_guid, entity_type, description, rating) VALUES (${feedbackGuid}, ${userGuid}, ${entityGuid}, ${entityType}, ${desc}, ${rating})`;
  let query1 = db.query(sql1, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: 'Some Error Occured in Checking',
      });
    }
    return res.status(200).json({
      message: 'Success',
    });
  });
});


router.post('/password/change', checkAuth, (req, res) => {
  let userGuid = db.escape(req.userData.user_guid);
  let oldPass = db.escape(md5(req.body.OldPass));
  let newPass = db.escape(md5(req.body.NewPass));

  let promise = new Promise((resolve, reject) => {
    let sql1 = `SELECT * FROM users WHERE user_guid = ${userGuid} and password = ${oldPass}`;
    let query1 = db.query(sql1, (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json({
          message: 'Some Error Occured in Checking',
        });
      }

      if (result.length > 0)
      {
        resolve(result)
      }
      else
      {
        return res.status(500).json({
          message: 'Password not correct',
        });
      }
    });  
  })
  promise.then(
    (data) => {
        let sql1 = `UPDATE users SET password = ${newPass} WHERE password = ${oldPass} and user_guid = ${userGuid}`;
        let query1 = db.query(sql1, (err, result) => {
          if (err) {
            console.log(err);
            return res.status(500).json({
              message: 'Some Error Occured in Checking',
            });
          }
          return res.status(200).json({
            message: 'Success',
          });
        });
    }
  )

});


// booking route
router.post('/booking', checkAuth, (req, res) => {
  let bookingGuid = db.escape(uuidv4());
  var userGuid = db.escape(req.userData.user_guid);
  let packageGuid = db.escape(req.body.PackageGuid);
  let bookingDate = db.escape(req.body.BookingDate)

  let sql1 = `INSERT INTO booking (booking_guid, traveler_guid, package_guid, booking_date) VALUES (${bookingGuid}, ${userGuid}, ${packageGuid}, ${bookingDate})`;
  let query1 = db.query(sql1, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: 'Some Error Occured in Checking',
      });
    }
    return res.status(200).json({
      message: 'Success',
    });
  });
});


router.post('/booking/cancel', checkAuth, (req, res) => {
  let bookingGuid = db.escape(req.body.BookingGuid);

  let sql1 = `DELETE FROM booking WHERE booking_guid = ${bookingGuid}`;
  let query1 = db.query(sql1, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: 'Some Error Occured in Checking',
      });
    }
    return res.status(200).json({
      message: 'Success',
    });
  });
});




router.post('/package/available', checkAuth, (req, res) => {
  let packageGuid = db.escape(req.body.PackageGuid);
  let availability = db.escape(req.body.Availability)

  let sql1 = `UPDATE package SET is_available = ${availability} WHERE package_guid = ${packageGuid}`;
  let query1 = db.query(sql1, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: 'Some Error Occured in Checking',
      });
    }
    return res.status(200).json({
      message: 'Success',
    });
  });
});

// payment route

router.post('/user/payment', checkAuth, async (req, res) => {
  var paymentGuid = db.escape(uuidv4());
  var userGuid = db.escape(req.userData.user_guid);
  var packageGuid = db.escape(req.body.PackageGuid);
  var price = req.body.Price;
  var email = req.body.Email;
  var m_email = req.body.Email;

  var c_expiryMonth = req.body.ExpiryMonth;
  var c_expiryYear = req.body.ExpiryYear;
  var c_cvc = req.body.CVC;
  var c_card = req.body.Card;
  var expiryDate = c_expiryMonth + '/' + c_expiryYear;

  var Publishable_Key =
    'pk_test_51LyJTRHHR869bYiRJ50wMehT63wHEFc4uCLal5Rx2hXwk4W3IXv9XG2AoSnwdf1SkUida8Z8U5QP7HQ9rHQ3gjqy00Y99eU9y7';
  var Secret_Key =
    'sk_test_51LyJTRHHR869bYiRhw0Ex578avVbQ9Z4No6sgGrpZYUhO0mS6zjvRQpZRMY88Jx8UR8NyuXSbP35U3fl0PQcRpga00JDY2D0kw';

  const stripe = require('stripe')(Secret_Key);

  try {
    const customer = await stripe.customers.create({
      description: email,
    });

    if (customer == '' || customer == null) {
      return res.status(500).json({
        message: 'Error Occured in Stripe Customer',
      });
    }

    const card_Token = await stripe.tokens.create({
      card: {
        number: c_card.replace(/\s/g, ''),
        exp_month: Number(c_expiryMonth),
        exp_year: Number(c_expiryYear),
        cvc: c_cvc,
      },
    });

    if (card_Token == '' || card_Token == null) {
      return res.status(500).json({
        message: 'Error Occured in Stripe CardToken',
      });
    }
    const card = await stripe.customers.createSource(customer.id, {
      source: card_Token.id,
    });

    console.log(card);

    var amount = 0;
    amount = Number(price);
    const createCharge = await stripe.charges.create({
      receipt_email: email,
      amount: amount * 100, //USD*100
      currency: 'PKR',
      card: card.id,
      customer: customer.id,
    });
    console.log(createCharge.id);
    if (createCharge == '' || createCharge == null) {
      return res.status(500).json({
        message: 'Error Occured in Stripe Charges',
      });
    }

    if (createCharge.status == 'succeeded') {
      // Here we will add an entry to payment
      let user_add = `INSERT INTO payment (payment_guid, user_guid, package_guid, price) VALUES (${paymentGuid}, ${userGuid}, ${packageGuid}, ${price})`;
      let user_add_query = db.query(
        user_add,
        (user_add_err, user_add_result) => {
          if (user_add_err) {
            console.log(user_add_err);
            return res.status(500).json({
              message: 'Error Occured in Inserting Data',
            });
          }
        }
      );
      // Sending Mail to user
      let mail_body =
        'Dear Customer, \n\n You have successfully made a payment. \n\n Your Receipt Url is: ' +
        createCharge.receipt_url +
        ' \n Your Refund Url is: ' +
        createCharge.refunds.url;
      sendConfirmation(
        m_email,
        'Confirmation of Email from Travelmania',
        mail_body
      );
      return res.status(200).json({
        message: 'Payment Successful!',
      });
    } else {
      console.log(err);
      return res.status(500).json({
        message: 'Stripe Payment Failed!',
      });
    }
    console.log('----------------------------');
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: 'Payment Failed',
    });
  }
});

router.post('/chat/add', checkAuth, (req, res) => {
  let inboxGuid = db.escape(uuidv4());
  let senderGuid = db.escape(req.userData.user_guid);
  let receiverGuid = db.escape(req.body.ReceiverGuid);
  let message = db.escape(req.body.Message);

  let sql1 = `INSERT INTO inbox (inbox_guid, sender_guid, receiver_guid, message) VALUES (${inboxGuid}, ${senderGuid}, ${receiverGuid}, ${message})`;
  let query1 = db.query(sql1, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: 'Some Error Occured in Checking',
      });
    }
    return res.status(200).json({
      message: 'Success',
    });
  });
});

module.exports = router;
