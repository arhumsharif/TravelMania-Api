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

// Load your AWS credentials and try to instantiate the object.
let reqPath = path.join(__dirname, "../");
aws.config.loadFromPath(reqPath + "AwsCredentials/aws.json");

// Instantiate SES.
var ses = new aws.SES();
// Intialized for AWS

async function RequestServer(filename, file) {
  ampq.connect("amqp://localhost", (err, conn) => {
    conn.createChannel((err, ch) => {
      if (err) {
        console.log("Error Occur");
        setTimeout(() => {
          conn.close();
        }, 500);
      }
      const q = "file";
      ch.assertQueue(q, { durable: false });
      ch.sendToQueue(
        q,
        Buffer.from(JSON.stringify({ filename: filename, file: file }))
      );
      console.log(" [x] Sent 'file'");
    });
    setTimeout(() => {
      conn.close();
    }, 500);
  });
}

router.get("/", checkAuth, (req, res) => {
  res.send("post Routes are working...");
});

// ----------------------------------------------------------
// Send Confirmation of Registration
const sendConfirmation = (receiver, subject, text) => {
  var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "arhumsharif06@gmail.com",
      pass: "otslwknoqspbdsue",
    },
  });

  var mailOptions = {
    from: "arhumsharif06@gmail.com",
    to: receiver,
    subject: subject,
    text: text,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};

// router.get("/make-temp", (req, res) => {
// var sesv2 = new aws.SESV2();
//   var params = {
//     TemplateContent: { /* required */
//       Html: '<h1> Verification Email From Commercial Cashflow Calculator',
//       Subject: 'Follow the link to verify your Email',
//     },
//     TemplateName: 'VTV1' /* required */
//   };
//   sesv2.createEmailTemplate(params, function(err, data) {
//     if (err) console.log(err, err.stack); // an error occurred
//     else     console.log(data);           // successful response
//   });
// })

// Sending Mail Using Aws
const sendMailUsingAWS = async (email, subject, text) => {
  var params = {
    EmailAddress: email,
  };

  ses.verifyEmailAddress(params, function (err, data) {
    if (err) {
      return err;
    } else {
      console.log(data);
      return data;
    }
  });
};

// Sending Mail Using Aws
const sendMessageUsingAWS = async (email, subject, text) => {
  var ses_mail =
    "From: admin@commercialcashflowcalculator.com <" + email + ">\n";
  ses_mail = ses_mail + "To: " + email + "\n";
  ses_mail = ses_mail + "Subject: " + subject + "\n";
  ses_mail = ses_mail + "MIME-Version: 1.0\n";
  ses_mail =
    ses_mail + 'Content-Type: multipart/mixed; boundary="NextPart"\n\n';
  ses_mail = ses_mail + "--NextPart\n";
  ses_mail = ses_mail + "Content-Type: text/html; charset=us-ascii\n\n";
  ses_mail = ses_mail + text + "\n\n";

  var params = {
    RawMessage: { Data: new Buffer(ses_mail) },
    Destinations: [email],
    Source: "'AWS Tutorial Series' <" + email + ">'",
  };

  ses.sendRawEmail(params, function (err, data) {
    if (err) {
      console.log(err);
      return err;
    } else {
      console.log(data);
    }
  });
};

// Date Formatter
function formatDate(date) {
  var d = new Date(date),
    month = "" + (d.getMonth() + 1),
    day = "" + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;

  return [year, month, day].join("-");
}

// OTP generator
const otpGenerator = () => {
  let otp = "";
  for (let i = 0; i < 6; i++) {
    let digit = Math.floor(Math.random() * 10);
    otp += digit;
  }
  return otp;
};

// router.get("/email", async (req, res) => {
//   await sendMailUsingAWS("", "", "");
//   return res.status(200).json({
//     message: "sent",
//   });
// });

router.post("/add-profile-pic", checkAuth, async (req, res) => {
  console.log("requested");
  let file = req.body.file;
  const type = file.split(";")[0].split("/")[1];

  // console.log(type);
  if (
    type.toLowerCase() != "png" &&
    type.toLowerCase() != "jpeg" &&
    type.toLowerCase() != "jpg"
  ) {
    return res
      .status(401)
      .json({ message: "File can't be other than PNG, JPG or JPEG" });
  }
  filename = uuidv4() + "." + type;
  RequestServer(filename, file);
  filename = db.connection.escape(filename);
  let guid = db.connection.escape(req.userData.user_guid);
  let sql = `UPDATE users SET profile = ${filename} where user_guid=${guid}`;
  let query1 = db.Query(sql).then(({err, result}) => {
    if (err) {
      return res.status(501).json({ message: "Error Occur in updating" });
    }
    return res.status(200).json({ message: "Saved Successfully" });
  });
});

// Post Route For Signing Up a User
router.post("/register", (req, res) => {
  let firstName = db.connection.escape(req.body.FirstName);
  let lastName = db.connection.escape(req.body.LastName);
  let getEmail = req.body.Email;
  let password = db.connection.escape(md5(req.body.Password));
  let email = db.connection.escape(getEmail);
  let userGuidtemp = uuidv4();

  let userGuid = db.connection.escape(userGuidtemp);
  // Got the attributes from front end
  // Check if a user exists with same email
  let promiseOne = new Promise((resolve, reject) => {
    let sql1 = `SELECT * FROM users WHERE email = ${email}`;
    let query1 = db.Query(sql1).then(({err, result}) => {
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
      console.log(password);
      let sql2 = `INSERT INTO users (first_name, last_name, email, password, user_guid, secret_key) VALUES(${firstName},${lastName},${email},${password},${userGuid},'')`;
      let query2 = db.Query(sql2).then(({err:err1, result:result1}) => {
        if (err1) {
          return res.status(500).json({
            message: "Some Error Occured in Inserting Data",
          });
        }
        // sendConfirmation(getEmail, "Confirmation Email for Registering", "You have successfully registered at Mogul Lifestyle");
        // sendMailUsingAWS(getEmail, "", "");
        return res.status(200).json({
          message: "Success",
          user_guid: userGuidtemp,
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

// Resend Email
router.post("/resend-email", (req, res) => {
  let email = req.body.Email;
  // sendMailUsingAWS(email, "", "");

  return res.status(200).json({});
});

// Verify User
router.post("/verify-email", (req, res) => {
  let getEmail = req.body.Email;
  // Getting email with quotes
  let email = db.connection.escape(getEmail);

  // Getting in a promise
  let promiseOne = new Promise((resolve, reject) => {
    ses.listVerifiedEmailAddresses(function (err, data) {
      if (err) {
        reject(err);
      } else {
        if (data.VerifiedEmailAddresses.includes(getEmail)) {
          resolve(data);
        } else {
          reject(data);
        }
      }
    });
  });
  promiseOne.then(
    (data) => {
      let sql1 = `UPDATE users SET is_verified = '1' WHERE email = ${email}`;
      let query1 = db.Query(sql1).then(({err, result}) => {
        if (err) {
          console.log(err);
          return res.status(500).json({
            message: "Some Error Occured in Checking Email",
          });
        }
        return res.status(200).json({
          message: "Verified",
        });
      });
    },
    (error) => {
      return res.status(400).json({
        message: "No record found",
      });
    }
  );
});

// Send OTP
router.post("/forgot-password", (req, res) => {
  let getEmail = req.body.Email;
  let email = db.connection.escape(getEmail);
  let otp = otpGenerator();
  let promiseOne = new Promise((resolve, reject) => {
    let sql1 = `SELECT * FROM users WHERE email = ${email}`;
    let query1 = db.Query(sql1).then(({err, result}) => {
      if (err) {
        console.log(err);
        return res.status(500).json({
          message: "Some Error Occured in Checking Email",
        });
      }
      if (result.length > 0) {
        resolve(result);
      }
      reject("No email Found");
    });
  });
  promiseOne.then(
    (valid) => {
      let sql1 = `UPDATE users SET otp_code = ${otp} WHERE email = ${email}`;
      let query1 = db.Query(sql1).then(({err, result}) => {
        if (err) {
          console.log(err);
          return res.status(500).json({
            message: "Error Occured",
          });
        }
        // send email
        sendConfirmation(
          getEmail,
          "OTP to Reset Password",
          "Your OTP code is: " + otp
        );
        // send response
        return res.status(200).json({
          message: "Success OTP",
        });
      });
    },
    (invalid) => {
      return res.status(500).json({
        message: invalid,
      });
    }
  );
});

// Forgot Password
router.post("/forgot-password-change", (req, res) => {
  let email = db.connection.escape(req.body.Email);
  let otp = req.body.Otp;
  let promiseOne = new Promise((resolve, reject) => {
    let sql1 = `SELECT * FROM users WHERE email = ${email}`;
    let query1 = db.Query(sql1).then(({err, result}) => {
      if (err) {
        console.log(err);
        return res.status(500).json({
          message: "Some Error Occured in Checking Email",
        });
      }
      if (result.length > 0) {
        resolve(result);
      }
      reject("No email Found");
    });
  });
  promiseOne.then(
    (valid) => {
      console.log(valid[0].otp_code);
      console.log(otp);
      if (valid[0].otp_code == otp) {
        // send response
        return res.status(200).json({
          message: "Success OTP verification",
        });
      } else {
        let sql1 = `UPDATE users SET otp_code = '' WHERE email = ${email}`;
        let query1 = db.Query(sql1).then(({err, result}) => {
          if (err) {
            console.log(err);
            return res.status(500).json({
              message: "Error Occured",
            });
          }
          // send response
          return res.status(500).json({
            message: "Failed OTP verification",
          });
        });
      }
    },
    (invalid) => {
      // send response
      return res.status(500).json({
        message: "Error Occured",
      });
    }
  );
});

// Change Password
router.post("/change-password-user", (req, res) => {
  let email = db.connection.escape(req.body.Email);
  let password = db.connection.escape(md5(req.body.Password));

  let sql1 = `UPDATE users SET password = ${password} WHERE email = ${email}`;
  let query1 = db.Query(sql1).then(({err, result}) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: "Error Occured",
      });
    }
    // send response
    return res.status(200).json({
      message: "Password Changed",
    });
  });
});

// Cancel member ship
router.post("/cancel-membership", checkAuth, (req, res) => {
  let userGuid = db.connection.escape(req.userData.user_guid);
  let sql = `UPDATE user_subscriptions SET is_deleted = '1' WHERE user_guid = ${userGuid}`;
  let query = db.Query(sql).then(({err, result}) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: "Some Error Occured",
      });
    }
    return res.status(200).json({
      result,
    });
  });
});

// Add a new coupon
router.post("/add-coupon", checkAuth, (req, res) => {
  let couponGuid = db.connection.escape(uuidv4());
  let coupon_name = db.connection.escape(req.body.Name);
  let coupon_code = db.connection.escape(req.body.Code);
  let total_coupons = req.body.Limit;
  let sql1 = `INSERT INTO coupons (coupon_guid, user_guid, coupon_name, coupon_code, status, percentage) VALUES `;
  for (let i = 0; i < total_coupons; i++) {
    let couponGuid = db.connection.escape(uuidv4());
    sql1 += `(${couponGuid}, '', ${coupon_name}, ${coupon_code}, '0', '100'),`;
  }
  sql1 = sql1.slice(0, -1);
  let query1 = db.Query(sql1).then(({err, result}) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: "Error Occured",
      });
    }
    // send response
    return res.status(200).json({
      message: "Coupon added successfully",
    });
  });
});

// Update coupon with user
router.post("/check-coupon", (req, res) => {
  let userGUID = db.connection.escape(req.body.UserGuid);
  let couponCode = db.connection.escape(req.body.Code);

  let promiseOne = new Promise((resolve, reject) => {
    // 0 means coupon active
    // 1 means coupon inactive
    let sql1 = `SELECT * FROM coupons WHERE coupon_code = ${couponCode} and status = '0'`;
    let query1 = db.Query(sql1).then(({err, result}) => {
      if (err) {
        console.log(err);
        return res.status(500).json({
          message: "Error Occured",
        });
      }
      if (result.length >= 1) {
        resolve(result);
      } else {
        reject("Coupon expired");
      }
    });
  });
  promiseOne.then(
    (data) => {
      // Now update coupon with user guid
      let sql2 = "";
      sql2 = `UPDATE coupons SET status = '1', user_guid=${userGUID}  WHERE coupon_guid = ${db.connection.escape(
        data[0].coupon_guid
      )}`;
      let query2 = db.Query(sql2).then(({err, result}) => {
        if (err) {
          console.log(err);
          return res.status(500).json({
            message: "Error Occured",
          });
        }
        return res.status(200).json({
          message: "Valid",
        });
      });
    },
    (error) => {
      return res.status(500).json({
        message: error,
      });
    }
  );
});

router.post("/check-coupon-validity", checkAuth, (req, res) => {
  let userGuid = db.connection.escape(req.userData.user_guid);
  let date = new Date();
  let todayDate = formatDate(date);

  let sql1 = `SELECT * FROM coupons WHERE ${todayDate} < DATE_ADD(date_created, INTERVAL 90 DAY) AND user_guid = ${userGuid}`;
  let query1 = db.Query(sql1).then(({err, result}) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: "Error Occured",
      });
    }
    console.log(result);
    if (result.length >= 1) {
      // send response
      return res.status(200).json({
        message: "Valid",
      });
    } else {
      // send response
      return res.status(500).json({
        message: "Not Found",
      });
    }
  });
});

// Add Assumptions for User
router.post("/add-assumptions", checkAuth, (req, res) => {
  let assumptionsGuid = db.connection.escape(uuidv4());
  let propertyGuid = db.connection.escape(req.body.PropertyGuid);
  let gpri = db.connection.escape(req.body.Gpri);
  let occupancy = db.connection.escape(req.body.Occupancy);
  let expense = db.connection.escape(req.body.Expense);

  // Promise Two to resolve
  let promiseOne = new Promise((resolve, reject) => {
    let sql1 = `SELECT * FROM assumptions WHERE property_guid = ${propertyGuid}`;
    let query1 = db.Query(sql1).then(({err, result}) => {
      if (err) {
        console.log(err);
        return res.status(500).json({
          message: "Some Error Occured in Checking Assumptions",
        });
      }
      if (result.length == 1) {
        resolve(result);
      }
      reject(result);
    });
  });
  promiseOne.then(
    (update) => {
      let sql = `UPDATE assumptions SET gpri_increase = ${gpri}, occupance_increase = ${occupancy}, expense_increase = ${expense}
       WHERE property_guid = ${propertyGuid}`;

      let query = db.Query(sql).then(({err, result}) => {
        if (err) {
          return res.status(500).json({
            message: "Error Occured in Updating Data",
          });
        }
        return res.status(200).json({
          message: "Data has been Successfully Updated",
        });
      });
    },
    (add) => {
      let sql = `INSERT INTO assumptions (assumptions_guid, property_guid, gpri_increase, occupance_increase, expense_increase) 
    VALUES (${assumptionsGuid}, ${propertyGuid}, ${gpri}, ${occupancy}, ${expense})`;

      let query = db.Query(sql).then(({err, result}) => {
        if (err) {
          return res.status(500).json({
            message: "Error Occured in Adding Data",
          });
        }
        return res.status(200).json({
          message: "Data has been Successfully Added",
        });
      });
    }
  );
});

// Route for changing user pass
router.post("/change-password", checkAuth, (req, res) => {
  let userGuid = db.connection.escape(req.userData.user_guid);
  let email = db.connection.escape(req.body.Email);
  let password = db.connection.escape(md5(req.body.Password));
  let newPassword = db.connection.escape(md5(req.body.NewPassword));
  console.log(password);
  console.log(email);
  // Promise Structure
  let promiseOne = new Promise((resolve, reject) => {
    let sql1 = `SELECT * FROM users WHERE email = ${email} and password = ${password}`;
    let query1 = db.Query(sql1).then(({err, result}) => {
      if (err) {
        console.log(err);
        return res.status(500).json({
          message: "Some Error Occured in Checking Email",
        });
      }
      if (result.length == 1) {
        resolve(result);
      }
      reject("Invalid Email and Password");
    });
  });
  promiseOne.then(
    (data) => {
      // Email Found With this Email
      let sql2 = `UPDATE users SET password = ${newPassword} WHERE email = ${email}`;
      let query2 = db.Query(sql2).then(({err:err1, result:result1}) => {
        if (err1) {
          return res.status(500).json({
            message: "Some Error Occured in Updating Password",
          });
        }
        return res.status(200).json({
          message: "Password has been Updated Successfully",
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

// Route for adding appartment-mix
router.post("/apartment-mix-edit", checkAuth, (req, res) => {
  let apartmentMixGuid = db.connection.escape(uuidv4());
  let propertyGuid = db.connection.escape(req.body.PropertyGuid);
  let familyUnits = db.connection.escape(req.body.FamilyUnits);
  let beds = db.connection.escape(req.body.Beds);
  let homeOwners = db.connection.escape(req.body.HomeOwners);
  let leaseAggrement = db.connection.escape(req.body.LeaseAggrement);
  let leaseExpires = db.connection.escape(req.body.LeaseExpires);
  let utiltiesOwner = db.connection.escape(req.body.UtiltiesOwner);
  let utiltiesAmount = db.connection.escape(req.body.UtiltiesAmount);
  let bath = db.connection.escape(req.body.Bath);
  let rent = db.connection.escape(req.body.Rent);
  let vacant_or_occupied = db.connection.escape(req.body.Vacant_or_occupied);
  let garage = db.connection.escape(req.body.Garage);
  let style = db.connection.escape(req.body.Style);
  let sqft = db.connection.escape(req.body.SQFT);
  let lotSize = db.connection.escape(req.body.LotSize);
  let yearBuilt = db.connection.escape(req.body.YearBuilt);
  let taxes = db.connection.escape(req.body.Taxes);
  let amenties = db.connection.escape(req.body.Amenties);
  let basement = db.connection.escape(req.body.Basement);
  let bulkhead = db.connection.escape(req.body.Bulkhead);
  let condos = db.connection.escape(req.body.Condos);
  let pool = db.connection.escape(req.body.Pool);

  let sql = `INSERT INTO apartment_mix (apartment_mix_guid, property_guid, family_units, beds, home_owners, lease_aggreement, lease_expires, utilities_owner, utilities_amount, bath, rent, vacant_or_occupied, garage, style, sqft, lot_size, year_built, taxes, pool, amenities, basement, bulkhead, condos) 
  VALUES (${apartmentMixGuid}, ${propertyGuid}, ${familyUnits}, ${beds}, ${homeOwners}, ${leaseAggrement}, ${leaseExpires}, ${utiltiesOwner}, ${utiltiesAmount}, ${bath}, ${rent}, ${vacant_or_occupied}, ${garage}, ${style}, ${sqft}, ${lotSize}, ${yearBuilt}, ${taxes}, ${pool}, ${amenties}, ${basement}, ${bulkhead}, ${condos})`;

  let query = db.Query(sql).then(({err, result}) => {
    if (err) {
      return res.status(500).json({
        message: "Error Occured in Inserting Data",
      });
    }
    return res.status(200).json({
      message: "Data has been Successfully Inserted",
    });
  });
});

// Route for updating appartment-mix
router.post("/apartment-mix-edit-update", checkAuth, (req, res) => {
  let apartmentMixGuid = db.connection.escape(req.body.ApartmentMixGuid);
  let propertyGuid = db.connection.escape(req.body.PropertyGuid);
  let familyUnits = db.connection.escape(req.body.FamilyUnits);
  let beds = db.connection.escape(req.body.Beds);
  let homeOwners = db.connection.escape(req.body.HomeOwners);
  let leaseAggrement = db.connection.escape(req.body.LeaseAggrement);
  let leaseExpires = db.connection.escape(req.body.LeaseExpires);
  let utiltiesOwner = db.connection.escape(req.body.UtiltiesOwner);
  let utiltiesAmount = db.connection.escape(req.body.UtiltiesAmount);
  let bath = db.connection.escape(req.body.Bath);
  let rent = db.connection.escape(req.body.Rent);
  let vacant_or_occupied = db.connection.escape(req.body.Vacant_or_occupied);
  let garage = db.connection.escape(req.body.Garage);
  let style = db.connection.escape(req.body.Style);
  let sqft = db.connection.escape(req.body.SQFT);
  let lotSize = db.connection.escape(req.body.LotSize);
  let yearBuilt = db.connection.escape(req.body.YearBuilt);
  let taxes = db.connection.escape(req.body.Taxes);
  let amenties = db.connection.escape(req.body.Amenties);
  let basement = db.connection.escape(req.body.Basement);
  let bulkhead = db.connection.escape(req.body.Bulkhead);
  let condos = db.connection.escape(req.body.Condos);
  let pool = db.connection.escape(req.body.Pool);
  let sql = `UPDATE apartment_mix set family_units = ${familyUnits}, beds = ${beds}, home_owners = ${homeOwners}, lease_aggreement = ${leaseAggrement}, lease_expires = ${leaseExpires}, utilities_owner = ${utiltiesOwner}, utilities_amount = ${utiltiesAmount}, bath = ${bath}, rent = ${rent}, vacant_or_occupied = ${vacant_or_occupied},  
  garage = ${garage}, style = ${style}, sqft = ${sqft}, lot_size = ${lotSize}, year_built = ${yearBuilt}, taxes = ${taxes}, pool = ${pool}, amenities = ${amenties}, 
  basement = ${basement}, bulkhead = ${bulkhead}, condos = ${condos} 
  WHERE apartment_mix_guid = ${apartmentMixGuid} and property_guid = ${propertyGuid}`;

  let query = db.Query(sql).then(({err, result}) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: "Error Occured in Inserting Data",
      });
    }
    return res.status(200).json({
      message: "Data has been Successfully Inserted",
    });
  });
});

// Route for unit-mix data
router.post("/unit-mix", checkAuth, (req, res) => {
  let unitMixGuid = db.connection.escape(uuidv4());
  let propertyGuid = db.connection.escape(req.body.PropertyGuid);
  let type = db.connection.escape(req.body.Type);
  let width = db.connection.escape(req.body.Width);
  let depth = db.connection.escape(req.body.Depth);
  let occupied = db.connection.escape(req.body.Occupied);
  let vacant = db.connection.escape(req.body.Vacant);
  let offline = db.connection.escape(req.body.Offline);
  let rent = db.connection.escape(req.body.Rent);

  let sql = `INSERT INTO unit_mix (unit_mix_guid, property_guid, type, width, depth, occupied, vacant, offline, rent) VALUES 
  (${unitMixGuid}, ${propertyGuid}, ${type}, ${width}, ${depth}, ${occupied}, ${vacant}, ${offline}, ${rent})`;

  let query = db.Query(sql).then(({err, result}) => {
    if (err) {
      return res.status(500).json({
        message: "Error Occured in Inserting Data",
      });
    }
    return res.status(200).json({
      message: "Data has been Successfully Inserted",
    });
  });
});

// Route for unit-mix edit
router.post("/unit-mix-edit", checkAuth, (req, res) => {
  let unitMixGuid = db.connection.escape(req.body.UnitMixGuid);
  let propertyGuid = db.connection.escape(req.body.PropertyGuid);
  let type = db.connection.escape(req.body.Type);
  let width = db.connection.escape(req.body.Width);
  let depth = db.connection.escape(req.body.Depth);
  let occupied = db.connection.escape(req.body.Occupied);
  let vacant = db.connection.escape(req.body.Vacant);
  let offline = db.connection.escape(req.body.Offline);
  let rent = db.connection.escape(req.body.Rent);

  let sql = `UPDATE unit_mix set type = ${type}, width = ${width}, depth = ${depth}, occupied = ${occupied}, vacant = ${vacant}, offline = ${offline}, rent = ${rent}  
  WHERE unit_mix_guid = ${unitMixGuid} and property_guid = ${propertyGuid}`;

  let query = db.Query(sql).then(({err, result}) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: "Error Occured in Inserting Data",
      });
    }
    return res.status(200).json({
      message: "Data has been Successfully Inserted",
    });
  });
});

// Post Route for Appartment Unit Mix
router.post("/appartment-unit-mix", checkAuth, (req, res) => {
  let appartmentUnitMixGuid = db.connection.escape(uuidv4());

  let userID = db.connection.escape(req.userData.user_guid);
  let propertyID = db.connection.escape(req.body.PropertyID);
  let leadManager = db.connection.escape(req.body.LeadManager);
  let email = db.connection.escape(req.body.Email);
  let beds = db.connection.escape(req.body.Beds);
  let bath = db.connection.escape(req.body.Bath);
  let garage = db.connection.escape(req.body.Garage);
  let style = db.connection.escape(req.body.Style);
  let sqft = db.connection.escape(req.body.Sqft);
  let lotSize = db.connection.escape(req.body.LotSize);
  let yearBuilt = db.connection.escape(req.body.YearBuilt);
  let taxes = db.connection.escape(req.body.Taxes);
  let pool = db.connection.escape(req.body.Pool);
  let amenities = db.connection.escape(req.body.Amenities);
  let basement = db.connection.escape(req.body.Basement);
  let bulkheadCondition = db.connection.escape(req.body.BulkheadCondition);
  let condos = db.connection.escape(req.body.Condos);
  let landLotSize = db.connection.escape(req.body.LandLotSize);
  let isLotBuildable = db.connection.escape(req.body.IsLotBuildable);
  let zoning = db.connection.escape(req.body.Zoning);
  let publicWaterOrSewerLine = db.connection.escape(req.body.PublicWaterOrSewerLine);
  let mortageInfo = db.connection.escape(req.body.MortageInfo);
  let backTaxes = db.connection.escape(req.body.BackTaxes);
  let askingPrice = db.connection.escape(req.body.AskingPrice);
  let sliding = db.connection.escape(req.body.Sliding);
  let slidingDesc = db.connection.escape(req.body.SlidingDesc);
  let heating = db.connection.escape(req.body.Heating);
  let heatingDesc = db.connection.escape(req.body.HeatingDesc);
  let cooling = db.connection.escape(req.body.Cooling);
  let coolingDesc = db.connection.escape(req.body.CoolingDesc);
  let floors = db.connection.escape(req.body.Floors);
  let floorsDesc = db.connection.escape(req.body.FloorsDesc);
  let heatingSource = db.connection.escape(req.body.HeatingSource);
  let heatingSourceDesc = db.connection.escape(req.body.HeatingSourceDesc);
  let waterSource = db.connection.escape(req.body.WaterSource);
  let waterSourceDesc = db.connection.escape(req.body.WaterSourceDesc);
  let sewerSource = db.connection.escape(req.body.SewerSource);
  let sewerSourceDesc = db.connection.escape(req.body.SewerSourceDesc);
  let roof = db.connection.escape(req.body.Roof);
  let windows = db.connection.escape(req.body.Windows);
  let electric = db.connection.escape(req.body.Electric);
  let landscaping = db.connection.escape(req.body.Landscaping);
  let kitchen = db.connection.escape(req.body.Kitchen);
  let plumbing = db.connection.escape(req.body.Plumbing);
  let motivation = db.connection.escape(req.body.Motivation);
  let timeframe = db.connection.escape(req.body.Timeframe);

  // Data has been gotten
  // Save Data

  let sql = `INSERT INTO appartment_unit_mix (appartment_unit_mix_guid, user_guid, property_guid, lead_manager, email, beds, baths, garage, style, sqft, lot_size, year_built, taxes, pool, amenities, basement, bulkhead_condition, condos, land_lot_size, is_lot_buildable, zoning, public_water_or_sewer_line, mortage_info, back_taxes, asking_price, sliding, sliding_desc, heating, heating_desc, cooling, cooling_desc, floors, floors_desc, heating_source, heating_source_desc, water_source, water_source_desc, sewer_source, sewer_source_desc, roof, windows, electric, landscaping, kitchen, plumbing, motivation, timeframe) VALUES 
  (${appartmentUnitMixGuid}, ${userID}, ${propertyID}, ${leadManager}, ${email}, ${beds}, ${bath}, ${garage}, ${style}, ${sqft}, ${lotSize}, ${yearBuilt}, ${taxes}, ${pool}, ${amenities}, ${basement}, ${bulkheadCondition}, ${condos}, ${landLotSize}, ${isLotBuildable}, ${zoning}, ${publicWaterOrSewerLine}, ${mortageInfo}, ${backTaxes}, ${askingPrice}, ${sliding}, ${slidingDesc}, ${heating}, ${heatingDesc}, ${cooling}, ${coolingDesc}, ${floors}, ${floorsDesc}, ${heatingSource}, ${heatingSourceDesc}, ${waterSource}, ${waterSourceDesc}, ${sewerSource}, ${sewerSourceDesc}, ${roof}, ${windows}, ${electric}, ${landscaping}, ${kitchen}, ${plumbing}, ${motivation}, ${timeframe})`;

  let query = db.Query(sql).then(({err, result}) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: "Error Occured in Inserting Data",
      });
    }
    return res.status(200).json({
      message: "Data has been Successfully Inserted",
    });
  });
});

// Post Route For DEBTS
router.post("/debts", (req, res) => {
  let debtsGuid = db.connection.escape(uuidv4());
  let propertyID = db.connection.escape(req.body.PropertyID);
  let lenderName = db.connection.escape(req.body.LenderName);
  let downPaymentPercentage = db.connection.escape(req.body.DownPaymentPercentage);
  let downPaymentAmount = db.connection.escape(req.body.DownPaymentAmount);
  let points = db.connection.escape(req.body.Points);
  let vacant = db.connection.escape(req.body.Vacant);
  let feeClosingCost = db.connection.escape(req.body.FeeClosingCost);
  let apr = db.connection.escape(req.body.Apr);
  let amortizedYears = db.connection.escape(req.body.AmortizedYears);
  let balloonYears = db.connection.escape(req.body.BalloonYears);
  // Data has been gotten
  // Save Data
  let sql = `INSERT INTO debts (debts_guid, property_guid, lender_name, down_payment_percentage, down_payment_amount, points, vacant, fees_closing_cost, apr, amortized_years, balloon_years) VALUES (${debtsGuid}, ${propertyID}, ${lenderName}, ${downPaymentPercentage}, ${downPaymentAmount}, ${points}, ${vacant}, ${feeClosingCost}, ${apr}, ${amortizedYears}, ${balloonYears})`;
  let query = db.Query(sql).then(({err, result}) => {
    if (err) {
      return res.status(500).json({
        message: "Error Occured in Inserting Data",
      });
    }
    return res.status(200).json({
      message: "Data has been Successfully Inserted",
    });
  });
});

// Update Debts
router.post("/debts-update", (req, res) => {
  let debtsGuid = db.connection.escape(req.body.DebtGuid);
  let propertyID = db.connection.escape(req.body.PropertyID);
  let lenderName = db.connection.escape(req.body.LenderName);
  let downPaymentPercentage = db.connection.escape(req.body.DownPaymentPercentage);
  let downPaymentAmount = db.connection.escape(req.body.DownPaymentAmount);
  let points = db.connection.escape(req.body.Points);
  let vacant = db.connection.escape(req.body.Vacant);
  let feeClosingCost = db.connection.escape(req.body.FeeClosingCost);
  let apr = db.connection.escape(req.body.Apr);
  let amortizedYears = db.connection.escape(req.body.AmortizedYears);
  let balloonYears = db.connection.escape(req.body.BalloonYears);
  // Data has been gotten
  // Save Data
  let sql = `UPDATE debts SET lender_name = ${lenderName}, down_payment_percentage = ${downPaymentPercentage}, down_payment_amount = ${downPaymentAmount}, points = ${points}, vacant = ${vacant}, fees_closing_cost = ${feeClosingCost},apr = ${apr},amortized_years = ${amortizedYears},balloon_years = ${balloonYears} WHERE debts_guid = ${debtsGuid} and property_guid = ${propertyID}`;
  let query = db.Query(sql).then(({err, result}) => {
    if (err) {
      return res.status(500).json({
        message: "Error Occured in Inserting Data",
      });
    }
    return res.status(200).json({
      message: "Data has been Successfully Updated",
    });
  });
});

// Post Route For Notes
router.post("/notes", checkAuth, (req, res) => {
  let notesGuid = db.connection.escape(uuidv4());
  let userID = db.connection.escape(req.userData.user_guid);
  let propertyID = db.connection.escape(req.body.PropertyID);
  let notes = db.connection.escape(req.body.Notes);
  // Data has been gotten
  // Save Data
  let promiseOne = new Promise((resolve, reject) => {
    let sql = `SELECT * FROM notes WHERE property_guid = ${propertyID}`;
    let query = db.Query(sql).then(({err, result}) => {
      if (err) {
        return res.status(500).json({
          message: "Error Occured in Searching Data",
        });
      }

      if (result.length == 1) {
        resolve(result);
      }
      reject(result);
    });
  });
  promiseOne.then(
    (update) => {
      let sql = `UPDATE notes SET notes = ${notes} WHERE property_guid = ${propertyID}`;
      let query = db.Query(sql).then(({err, result}) => {
        if (err) {
          return res.status(500).json({
            message: "Error Occured in Updating Notes",
          });
        }
        return res.status(200).json({
          message: "Notes has been Successfully Updated",
        });
      });
    },
    (add) => {
      let sql = `INSERT INTO notes (notes_guid, user_guid, property_guid, notes) VALUES (${notesGuid},${userID}, ${propertyID}, ${notes})`;
      let query = db.Query(sql).then(({err, result}) => {
        if (err) {
          return res.status(500).json({
            message: "Error Occured in Inserting Notes",
          });
        }
        return res.status(200).json({
          message: "Notes has been Successfully Inserted",
        });
      });
    }
  );
});
// Post Route For Property-Expense
router.post("/property-expense", (req, res) => {
  let propertyExpenseGuid = db.connection.escape(uuidv4());
  let propertyID = db.connection.escape(req.body.PropertyGuid);
  let title = db.connection.escape(req.body.Title);
  let value = db.connection.escape(req.body.Value);
  console.log({ propertyExpenseGuid, propertyID, title, value });
  // Data has been gotten
  // Save Data
  let sql = `INSERT INTO property_expenses (property_expense_guid, property_guid, title, value ) VALUES (${propertyExpenseGuid}, ${propertyID}, ${title}, ${value})`;
  let query = db.Query(sql).then(({err, result}) => {
    if (err) {
      return res.status(500).json({
        message: "Error Occured in Inserting Data",
      });
    }
    return res.status(200).json({
      message: "Data has been Successfully Inserted",
    });
  });
});

// Post Route for expenses Updation
router.post("/property-expense-update", (req, res) => {
  let propertyExpenseGuid = db.connection.escape(req.body.ExpenseGuid);
  let propertyID = db.connection.escape(req.body.PropertyGuid);
  let title = db.connection.escape(req.body.Title);
  let value = db.connection.escape(req.body.Value);
  console.log({ propertyExpenseGuid, propertyID, title, value });
  // Data has been gotten
  // Save Data
  let promiseOne = new Promise((resolve, reject) => {
    let sql = `UPDATE property_expenses SET title = ${title}, value = ${value} WHERE property_expense_guid = ${propertyExpenseGuid} and property_guid = ${propertyID}`;
    console.log(sql);
    let query = db.Query(sql).then(({err, result}) => {
      if (err) {
        console.log(err);
        reject(err);
      }
      resolve(result);
    });
  });
  promiseOne.then(
    (data) => {
      console.log(data);
      return res.status(200).json({
        message: "Data has been Successfully Inserted",
      });
    },
    (error) => {
      return res.status(500).json({
        message: "Error Occured in Inserting Data",
      });
    }
  );
});

// Post Route for Property Income
router.post("/property-income", (req, res) => {
  let propertyIncomeGuid = db.connection.escape(uuidv4());
  let propertyID = db.connection.escape(req.body.PropertyGuid);
  let title = db.connection.escape(req.body.Title);
  let value = db.connection.escape(req.body.Value);
  // Data has been gotten
  // Save Data
  let sql = `INSERT INTO property_income (property_income_guid, property_guid, title, value ) VALUES (${propertyIncomeGuid}, ${propertyID}, ${title}, ${value})`;
  let query = db.Query(sql).then(({err, result}) => {
    if (err) {
      return res.status(500).json({
        message: "Error Occured in Inserting Data",
      });
    }
    return res.status(200).json({
      message: "Data has been Successfully Inserted",
    });
  });
});

// Post Route for Income Updation
router.post("/property-income-update", (req, res) => {
  let propertyIncomeGuid = db.connection.escape(req.body.IncomeGuid);
  let propertyID = db.connection.escape(req.body.PropertyGuid);
  let title = db.connection.escape(req.body.Title);
  let value = db.connection.escape(req.body.Value);
  // Data has been gotten
  // Save Data
  let sql = `Update property_income SET title = ${title}, value = ${value} WHERE property_guid = ${propertyID}
  and property_income_guid = ${propertyIncomeGuid}`;
  let query = db.Query(sql).then(({err, result}) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: "Error Occured in Inserting Data",
      });
    }
    return res.status(200).json({
      message: "Data has been Successfully Inserted",
    });
  });
});

// Post Route for Storage Unit Mix
router.post("/storage-unit-mix", checkAuth, (req, res) => {
  let storageUnitMixGuid = db.connection.escape(uuidv4());

  let userID = db.connection.escape(req.userData.user_guid);
  let propertyID = db.connection.escape(req.body.PropertyID);
  let numberOfBuildings = db.connection.escape(req.body.NumberOfBuildings);
  let otherPhone = db.connection.escape(req.body.OtherPhone);
  let driveway = db.connection.escape(req.body.Driveway);
  let features = db.connection.escape(req.body.Features);
  let yearRenovatedOne = db.connection.escape(req.body.YearRenovatedOne);
  let yearRenovatedTwo = db.connection.escape(req.body.YearRenovatedTwo);
  let yearBuiltOne = db.connection.escape(req.body.YearBuiltOne);
  let propertyAcreage = db.connection.escape(req.body.PropertyAcreage);
  let propertyClass = db.connection.escape(req.body.PropertyClass);
  let sellingPoints = db.connection.escape(req.body.SellingPoints);
  let constructionType = db.connection.escape(req.body.ConstructionType);
  let assessorParcelID = db.connection.escape(req.body.AssessorParcelID);
  let generalCondition = db.connection.escape(req.body.GeneralCondition);

  let accessControl = db.connection.escape(req.body.AccessControl);
  let perimeterFence = db.connection.escape(req.body.PerimeterFence);
  let securityLights = db.connection.escape(req.body.SecurityLights);
  let securityCameras = db.connection.escape(req.body.SecurityCameras);
  let rentalKiosk = db.connection.escape(req.body.RentalKiosk);
  let retailCenter = db.connection.escape(req.body.RetailCenter);
  let truckRental = db.connection.escape(req.body.TruckRental);
  let roadSign = db.connection.escape(req.body.RoadSign);

  let file = db.connection.escape(req.body.File);

  // Data has been gotten
  // Save Data

  let sql = `INSERT INTO storage_unit_mix (storage_unit_mix_guid, user_guid, property_guid, number_of_buidlings, other_phone, driveway, features, year_renovated_one, year_renovated_two, year_built_one, property_acreage, property_class, selling_points, construction_type, assessors_parcel_id, general_condition, access_control, perimeter_fence, security_lights, security_cameras, rental_kiosk, retail_center, truck_rental, road_sign,file) VALUES (${storageUnitMixGuid}, ${userID}, ${propertyID}, ${numberOfBuildings}, ${otherPhone}, ${driveway}, ${features}, ${yearRenovatedOne}, ${yearRenovatedTwo}, ${yearBuiltOne}, ${propertyAcreage}, ${propertyClass}, ${sellingPoints}, ${constructionType}, ${assessorParcelID}, ${generalCondition},${accessControl},${perimeterFence},${securityLights},${securityCameras},${rentalKiosk},${retailCenter},${truckRental},${roadSign}, ${file})`;

  let query = db.Query(sql).then(({err, result}) => {
    if (err) {
      return res.status(500).json({
        message: "Error Occured in Inserting Data",
      });
    }
    return res.status(200).json({
      message: "Data has been Successfully Inserted",
    });
  });
});

// Post Route For Subscription Plans
router.post("/subscription-plan", (req, res) => {
  let subscriptionPlanGuid = db.connection.escape(uuidv4());
  let userguid = db.connection.escape(req.body.UserGuid);
  let planDescription = db.connection.escape(req.body.PlanDescription);
  let price = db.connection.escape(req.body.Price);
  let durationInMonths = db.connection.escape(req.body.DurationInMonths);
  // Data has been gotten
  // Save Data
  let sql = `INSERT INTO subscription_plans (subscription_plan_id, plan_description, price, duration_in_months) VALUES (${subscriptionPlanGuid}, ${planDescription}, ${price}, ${durationInMonths})`;
  let query = db.Query(sql).then(({err, result}) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: "Error Occured in Inserting Data",
      });
    }
    return res.status(200).json({
      message: "Data has been Successfully Inserted",
    });
  });
});

// Post Route For User Subscriptions
router.post("/user-subscription", async (req, res) => {
  console.log("---------------------------");
  var c_name = req.body.Name;
  var c_email = req.body.Email;
  console.log(c_email);
  let phone = db.connection.escape(req.body.Phone);
  let country = db.connection.escape(req.body.Country);
  let zipCode = db.connection.escape(req.body.ZipCode);
  let payDate = db.connection.escape(req.body.PayDate);
  var c_expiryMonth = req.body.ExpiryMonth;
  var c_expiryYear = req.body.ExpiryYear;
  var c_cvc = req.body.CVC;
  var c_card = req.body.Card;
  let subscriptionPlanID = db.connection.escape(req.body.SubscriptionPlanID);
  let userSubscriptionID = db.connection.escape(uuidv4());
  let userGuid = db.connection.escape(req.body.UserID);
  var expiryDate = c_expiryMonth + "/" + c_expiryYear;

  var Publishable_Key =
    "pk_live_51JC7iAF4MVISsE9isl4IRKKQGUE9Mntwdkqbgfakx1CeYZ1v0MEByqn3WJWOvr5fwxJqHVTHsqzecNLPDvNTw0vy00EvAXLsyK";
  var Secret_Key =
    "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";

  //  developers credentials
  // var Publishable_Key = 'pk_test_51LyJTRHHR869bYiRJ50wMehT63wHEFc4uCLal5Rx2hXwk4W3IXv9XG2AoSnwdf1SkUida8Z8U5QP7HQ9rHQ3gjqy00Y99eU9y7';
  // var Secret_Key = 'sk_test_51LyJTRHHR869bYiRhw0Ex578avVbQ9Z4No6sgGrpZYUhO0mS6zjvRQpZRMY88Jx8UR8NyuXSbP35U3fl0PQcRpga00JDY2D0kw';
  const stripe = require("stripe")(Secret_Key);
  console.log(c_name);
  console.log(c_email);
  try {
    console.log("----------------------------");
    const customer = await stripe.customers.create({
      description: c_email,
    });
    console.log("----------------------------");
    if (customer == "" || customer == null) {
      return res.status(500).json({
        message: "Error Occured in Stripe Customer",
      });
    }

    console.log("----------------------------");
    const card_Token = await stripe.tokens.create({
      card: {
        number: c_card.replace(/\s/g, ""),
        exp_month: Number(c_expiryMonth),
        exp_year: Number(c_expiryYear),
        cvc: c_cvc,
      },
    });

    console.log("----------------------------");
    if (card_Token == "" || card_Token == null) {
      return res.status(500).json({
        message: "Error Occured in Stripe CardToken",
      });
    }
    const card = await stripe.customers.createSource(customer.id, {
      source: card_Token.id,
    });

    console.log(card);

    console.log("----------------------------");
    var amount = 0;
    let getsql = `SELECT * FROM subscription_plans where subscription_plan_id = ${subscriptionPlanID}`;
    let get_query = db.Query(getsql).then(async ({err, result}) => {
      if (err) {
        return res.status(500).json({
          message: err,
        });
      }
      console.log(result[0].price);
      amount = result[0].price;
      console.log("----------------------------");
      const createCharge = await stripe.charges.create({
        receipt_email: c_email,
        amount: amount, //USD*100
        currency: "USD",
        card: card.id,
        customer: customer.id,
      });
      console.log(createCharge.id);
      if (createCharge == "" || createCharge == null) {
        return res.status(500).json({
          message: "Error Occured in Stripe Charges",
        });
      }
      console.log("----------------------------");
      let transsql = `INSERT INTO trans_details
            (
            user_guid, 
            subscription_guid, 
            stripe_customer_id, 
            stripe_card_token_id, 
            stripe_card_id, 
            stripe_charge_id, 
            receipt_email, 
            receipt_url, 
            refund_url, 
            status, 
            stripe_sub_card, 
            stripe_amount
            ) 
            VALUES 
            (
              ${userGuid},
              ${userSubscriptionID},
              ${db.connection.escape(customer.id)},
              ${db.connection.escape(card_Token.id)},
              ${db.connection.escape(card.id)},
              ${db.connection.escape(createCharge.id)},
              ${db.connection.escape(createCharge.receipt_email)},
              ${db.connection.escape(createCharge.receipt_url)},
              ${db.connection.escape(createCharge.refunds.url)},
              ${db.connection.escape(createCharge.status)},
              ${db.connection.escape(createCharge.source.last4)},
              ${db.connection.escape(createCharge.amount)}
            )`;
      console.log(transsql);
      let transquery = db.Query(transsql).then(({err, result}) => {
        if (err) {
          console.log(err);
          return res.status(500).json({
            message: "Error Occured in Inserting Data",
          });
        }
        if (createCharge.status == "succeeded") {
          // Here we will add an entry to user_subscriptions
          let user_add = `INSERT INTO user_subscriptions (name, email, phone, country, zipcode, pay_date, expiry_date, subscription_plan_id, user_subscription_guid, user_guid) VALUES (${db.connection.escape(
            c_name
          )}, ${db.connection.escape(
            c_email
          )}, ${phone}, ${country}, ${zipCode}, ${payDate}, ${db.connection.escape(
            expiryDate
          )}, ${subscriptionPlanID}, ${userSubscriptionID}, ${userGuid})`;
          let user_add_query = db.Query(user_add).then(
            ({err:user_add_err, result:user_add_result}) => {
              if (user_add_err) {
                console.log(user_add_err);
                return res.status(500).json({
                  message: "Error Occured in Inserting Data",
                });
              }
            }
          );
          // Sending Mail to user
          let mail_body =
            "Dear Customer, \n\n You have successfully made a payment. \n\n Your Receipt Url is: " +
            createCharge.receipt_url +
            " \n Your Refund Url is: " +
            createCharge.refunds.url;
          // sendMessageUsingAWS(c_email, "Confirmation of Payment", mail_body);
          console.log(err);
          return res.status(200).json({
            message: "Payment Successful!",
          });
        } else {
          console.log(err);
          return res.status(500).json({
            message: "Stripe Payment Failed!",
          });
        }
      });
      console.log("----------------------------");
    });
  } catch (err) {
    return res.status(500).json({
      message: err,
    });
  }
});

router.post("/admin-subscription-edit", checkAuth, (req, res) => {
  let price = db.connection.escape(req.body.Price);
  let planID = db.connection.escape(req.body.PlanID);
  let sql = `UPDATE subscription_plans SET price = ${price} WHERE subscription_plan_id = ${planID}`;

  let query = db.Query(sql).then(({err, result}) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: "Error Occured in Inserting Plans",
      });
    }
    return res.status(200).json({
      message: "Data has been Successfully Updated",
    });
  });
});

// Post route for adding property property
router.post("/add-property", checkAuth, (req, res) => {
  let myproperty = uuidv4();
  let userGuid = db.connection.escape(req.userData.user_guid);
  let propertyGuid = db.connection.escape(myproperty);
  let propertyName = db.connection.escape(req.body.PropertyName);
  let propertyType = db.connection.escape(req.body.PropertyType);
  let purchasePrice = db.connection.escape(req.body.PurchasePrice);
  let fullName = db.connection.escape(req.body.FullName);
  let phone = db.connection.escape(req.body.Phone);
  let address = db.connection.escape(req.body.Address);
  let city = db.connection.escape(req.body.City);
  let zipCode = db.connection.escape(req.body.ZipCode);
  let state = db.connection.escape(req.body.State);
  let file = db.connection.escape(req.body.file);
  let filename = db.connection.escape(req.body.filename);
  const type = file.split(";")[0].split("/")[1];

  // console.log(type);
  if (
    type.toLowerCase() != "png" &&
    type.toLowerCase() != "jpeg" &&
    type.toLowerCase() != "jpg"
  ) {
    return res
      .status(401)
      .json({ message: "File can't be other than PNG, JPG or JPEG" });
  }
  filename = uuidv4() + "." + type;
  RequestServer(filename, file);
  // We will make a promise to make sure that property does not duplicate
  filename = db.connection.escape(filename);
  let promiseOne = new Promise((resolve, reject) => {
    let sql = `SELECT * from properties WHERE user_guid = ${userGuid} and property_name = ${propertyName} and is_deleted = '0'`;

    let query = db.Query(sql).then(({err, result}) => {
      if (err) {
        console.log(err);
        return res.status(500).json({
          message: "Error Occured in Searching Data",
        });
      }
      if (result.length > 0) {
        resolve(result);
      } else {
        resolve(result);
      }
    });
  });
  promiseOne.then(
    (data) => {
      let sql = `INSERT INTO properties (property_guid, user_guid, property_name, property_type, purchase_price, full_name, phone, address, city, zipcode, state, file) VALUES (${propertyGuid}, ${userGuid}, ${propertyName}, ${propertyType}, ${purchasePrice}, ${fullName}, ${phone}, ${address}, ${city}, ${zipCode}, ${state}, ${filename})`;

      let query = db.Query(sql).then(({err, result}) => {
        if (err) {
          console.log(err);
          return res.status(500).json({
            message: "Error Occured in Inserting Data",
          });
        }
        return res.status(200).json({
          message: "Data has been Successfully Inserted",
          property_guid: myproperty,
        });
      });
    },
    (error) => {
      return res.status(202).json({
        message: "Duplicate_Property",
      });
    }
  );
});

// Post route for deleting a property
router.post("/delete-property/:id", checkAuth, (req, res) => {
  let userGuid = db.connection.escape(req.userData.user_guid);
  let propertyGuid = db.connection.escape(req.params.id);
  let sql = `UPDATE properties SET is_deleted = '1' WHERE user_guid = ${userGuid} 
  and property_guid = ${propertyGuid}`;

  let query = db.Query(sql).then(({err, result}) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: "Error Occured in Deleting Data",
      });
    }
    return res.status(200).json({
      message: "Property has been Successfully Deleted",
    });
  });
});

// Post Route for adding default fields
router.post("/default-fields", checkAuth, (req, res) => {
  let propertyID = db.connection.escape(req.body.PropertyGuid);
  let propertyType = req.body.PropertyType;
  let promiseOne = new Promise((resolve, reject) => {
    let sql = `INSERT INTO property_expenses (property_expense_guid,property_guid, title, value) VALUES 
    (${db.connection.escape(
      uuidv4()
    )},${propertyID},'Advertising / Marketing','0'),(${db.connection.escape(
      uuidv4()
    )},${propertyID},'Management Fees','0'),(${db.connection.escape(
      uuidv4()
    )},${propertyID},'Professional Services','0'),
    (${db.connection.escape(
      uuidv4()
    )},${propertyID},'Cost of Goods Sold','0'),(${db.connection.escape(
      uuidv4()
    )},${propertyID},'Natural Gas','0'),(${db.connection.escape(
      uuidv4()
    )},${propertyID},'Real Estate Taxes','0'),
    (${db.connection.escape(uuidv4())},${propertyID},'Electric','0'),(${db.escape(
      uuidv4()
    )},${propertyID},'Office Supplies','0'),(${db.connection.escape(
      uuidv4()
    )},${propertyID},'Repairs / Maintainence','0'),
    (${db.connection.escape(uuidv4())},${propertyID},'Insurance','0'),(${db.escape(
      uuidv4()
    )},${propertyID},'Payroll & Benefits','0'),(${db.connection.escape(
      uuidv4()
    )},${propertyID},'Trash Service','0'),
    (${db.connection.escape(uuidv4())},${propertyID},'Landscaping','0'),(${db.escape(
      uuidv4()
    )},${propertyID},'Phone / Internet','0'),(${db.connection.escape(
      uuidv4()
    )},${propertyID},'Water / Sewer','0'),
    (${db.connection.escape(uuidv4())},${propertyID},'Misc Expenses','0')`;

    let query = db.Query(sql).then(({err, result}) => {
      if (err) {
        console.log(err);
        return res.status(500).json({
          message: "Error Occured in Inserting Default Expenses",
        });
      }
      resolve(result);
    });
  });
  promiseOne.then(
    (data) => {
      let promiseTwo = new Promise((resolve, reject) => {
        console.log(propertyType);
        let sql;
        if (propertyType == "Storage Unit") {
          sql = `INSERT INTO property_income (property_income_guid,property_guid, title, value) VALUES 
                (${db.connection.escape(
                  uuidv4()
                )},${propertyID},'(Net) Truck Rental Comissions','0'),(${db.connection.escape(
            uuidv4()
          )},${propertyID},'Tenant Insurance','0'),
                (${db.connection.escape(
                  uuidv4()
                )},${propertyID},'Rental Income','0'),(${db.connection.escape(
            uuidv4()
          )},${propertyID},'(Retail) Locks, Moving Supplies','0'),(${db.connection.escape(
            uuidv4()
          )},${propertyID},'Vending / Misc','0'),
                (${db.connection.escape(uuidv4())},${propertyID},'Other Income','0')`;
        } else {
          sql = `INSERT INTO property_income (property_income_guid,property_guid, title, value) VALUES 
              (${db.connection.escape(uuidv4())},${propertyID},'Vending','0'),(${db.escape(
            uuidv4()
          )},${propertyID},'Washing','0'),
              (${db.connection.escape(uuidv4())},${propertyID},'Utility','0')`;
        }

        let query = db.Query(sql).then(({err, result}) => {
          if (err) {
            console.log(err);
            return res.status(500).json({
              message: "Error Occured in Inserting Default Incomes",
            });
          }
          resolve(result);
        });
      });
      promiseTwo.then(
        (data) => {
          let promiseThree = new Promise((resolve, reject) => {
            let sql = `INSERT INTO assumptions (assumptions_guid, property_guid, gpri_increase, occupance_increase, expense_increase) 
                  VALUES (${db.connection.escape(
                    uuidv4()
                  )}, ${propertyID}, '1', '1', '1')`;

            let query = db.Query(sql).then(({err, result}) => {
              if (err) {
                console.log(err);
                return res.status(500).json({
                  message: "Error Occured in Inserting Default Incomes",
                });
              }
              resolve(result);
            });
          });
          promiseThree.then(
            (data) => {
              return res.status(200).json({
                message: "Default Fields have been added",
              });
            },
            (error) => {}
          );
        },
        (error) => {}
      );
    },
    (error) => {}
  );
});
// ----------------------------------------------------------
// ----------------------------------------------------------
// Updation Routes

router.post("/update-property", (req, res) => {
  let propertyGuid = db.connection.escape(req.body.PropertyGuid);
  let propertyName = db.connection.escape(req.body.PropertyName);
  let propertyType = db.connection.escape(req.body.PropertyType);
  let purchasePrice = db.connection.escape(req.body.PurchasePrice);
  let fullName = db.connection.escape(req.body.FullName);
  let phone = db.connection.escape(req.body.Phone);
  let address = db.connection.escape(req.body.Address);
  let city = db.connection.escape(req.body.City);
  let zipCode = db.connection.escape(req.body.ZipCode);
  let state = db.connection.escape(req.body.State);
  let sql = `UPDATE properties SET property_name = ${propertyName} , property_type = ${propertyType} , purchase_price = ${purchasePrice}
  , full_name = ${fullName}, phone = ${phone}, address = ${address}, city = ${city}, zipcode = ${zipCode}, state = ${state}
   WHERE property_guid = ${propertyGuid} AND is_deleted = 0`;

  let query = db.Query(sql).then(({err, result}) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: "Error Occured in Inserting Data",
      });
    }
    return res.status(200).json({
      message: "Data has been Updated Inserted",
    });
  });
});

router.post("/update-storage-unit-mix", (req, res) => {
  let propertyID = db.connection.escape(req.body.PropertyGuid);

  let numberOfBuildings = db.connection.escape(req.body.NumberOfBuildings);
  let otherPhone = db.connection.escape(req.body.OtherPhone);
  let driveway = db.connection.escape(req.body.Driveway);
  let features = db.connection.escape(req.body.Features);
  let yearRenovatedOne = db.connection.escape(req.body.YearRenovatedOne);
  let yearRenovatedTwo = db.connection.escape(req.body.YearRenovatedTwo);
  let yearBuiltOne = db.connection.escape(req.body.YearBuiltOne);
  let propertyAcreage = db.connection.escape(req.body.PropertyAcreage);
  let propertyClass = db.connection.escape(req.body.PropertyClass);
  let sellingPoints = db.connection.escape(req.body.SellingPoints);
  let constructionType = db.connection.escape(req.body.ConstructionType);
  let assessorParcelID = db.connection.escape(req.body.AssessorParcelID);
  let generalCondition = db.connection.escape(req.body.GeneralCondition);

  let accessControl = db.connection.escape(req.body.AccessControl);
  let perimeterFence = db.connection.escape(req.body.PerimeterFence);
  let securityLights = db.connection.escape(req.body.SecurityLights);
  let securityCameras = db.connection.escape(req.body.SecurityCameras);
  let rentalKiosk = db.connection.escape(req.body.RentalKiosk);
  let retailCenter = db.connection.escape(req.body.RetailCenter);
  let truckRental = db.connection.escape(req.body.TruckRental);
  let roadSign = db.connection.escape(req.body.RoadSign);

  let file = db.connection.escape(req.body.File);

  // Data has been gotten
  // Update Data

  let sql = `UPDATE storage_unit_mix SET number_of_buidlings = ${numberOfBuildings}, other_phone = ${otherPhone}, driveway = ${driveway}, features = ${features}, 
  year_renovated_one = ${yearRenovatedOne}, year_renovated_two = ${yearRenovatedTwo}, year_built_one = ${yearBuiltOne}, property_acreage = ${propertyAcreage},
  property_class = ${propertyClass}, selling_points = ${sellingPoints}, construction_type = ${constructionType}, assessors_parcel_id = ${assessorParcelID},
  general_condition = ${generalCondition}, access_control = ${accessControl}, perimeter_fence = ${perimeterFence}, security_lights = ${securityLights}, security_cameras = ${securityCameras},
  rental_kiosk = ${rentalKiosk}, retail_center = ${retailCenter}, truck_rental = ${truckRental}, road_sign = ${roadSign}, file = ${file}
  WHERE property_guid = ${propertyID} AND is_deleted = 0`;

  let query = db.Query(sql).then(({err, result}) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        message: "Error Occured in Inserting Data",
      });
    }
    return res.status(200).json({
      message: "Data has been Successfully Inserted",
    });
  });
});

router.post("/update-appartment-unit-mix", (req, res) => {
  let propertyID = db.connection.escape(req.body.PropertyGuid);

  let leadManager = db.connection.escape(req.body.LeadManager);
  let email = db.connection.escape(req.body.Email);
  let date = db.connection.escape(req.body.Date);
  let beds = db.connection.escape(req.body.Beds);
  let bath = db.connection.escape(req.body.Bath);
  let garage = db.connection.escape(req.body.Garage);
  let style = db.connection.escape(req.body.Style);
  let sqft = db.connection.escape(req.body.Sqft);
  let lotSize = db.connection.escape(req.body.LotSize);
  let yearBuilt = db.connection.escape(req.body.YearBuilt);
  let taxes = db.connection.escape(req.body.Taxes);
  let pool = db.connection.escape(req.body.Pool);
  let amenities = db.connection.escape(req.body.Amenities);
  let basement = db.connection.escape(req.body.Basement);
  let bulkheadCondition = db.connection.escape(req.body.BulkheadCondition);
  let condos = db.connection.escape(req.body.Condos);
  let landLotSize = db.connection.escape(req.body.LandLotSize);
  let isLotBuildable = db.connection.escape(req.body.IsLotBuildable);
  let zoning = db.connection.escape(req.body.Zoning);
  let publicWaterOrSewerLine = db.connection.escape(req.body.PublicWaterOrSewerLine);
  let mortageInfo = db.connection.escape(req.body.MortageInfo);
  let backTaxes = db.connection.escape(req.body.BackTaxes);
  let askingPrice = db.connection.escape(req.body.AskingPrice);
  let sliding = db.connection.escape(req.body.Sliding);
  let slidingDesc = db.connection.escape(req.body.SlidingDesc);
  let heating = db.connection.escape(req.body.Heating);
  let heatingDesc = db.connection.escape(req.body.HeatingDesc);
  let cooling = db.connection.escape(req.body.Cooling);
  let coolingDesc = db.connection.escape(req.body.CoolingDesc);
  let floors = db.connection.escape(req.body.Floors);
  let floorsDesc = db.connection.escape(req.body.FloorsDesc);
  let heatingSource = db.connection.escape(req.body.HeatingSource);
  let heatingSourceDesc = db.connection.escape(req.body.HeatingSourceDesc);
  let waterSource = db.connection.escape(req.body.WaterSource);
  let waterSourceDesc = db.connection.escape(req.body.WaterSourceDesc);
  let sewerSource = db.connection.escape(req.body.SewerSource);
  let sewerSourceDesc = db.connection.escape(req.body.SewerSourceDesc);
  let roof = db.connection.escape(req.body.Roof);
  let windows = db.connection.escape(req.body.Windows);
  let electric = db.connection.escape(req.body.Electric);
  let landscaping = db.connection.escape(req.body.Landscaping);
  let kitchen = db.connection.escape(req.body.Kitchen);
  let plumbing = db.connection.escape(req.body.Plumbing);
  let motivation = db.connection.escape(req.body.Motivation);
  let timeframe = db.connection.escape(req.body.Timeframe);

  // Data has been gotten
  // Save Data

  let sql = `UPDATE appartment_unit_mix SET lead_manager = ${leadManager}, email = ${email}, date = ${date}, beds = ${beds}, baths = ${bath},
  garage = ${garage}, style = ${style}, sqft = ${sqft}, lot_size = ${lotSize}, year_built = ${yearBuilt}, taxes = ${taxes}, pool = ${pool},
  amenities = ${amenities}, basement = ${basement}, bulkhead_condition = ${bulkheadCondition}, condos = ${condos}, land_lot_size = ${landLotSize},
  is_lot_buildable = ${isLotBuildable}, zoning = ${zoning}, public_water_or_sewer_line = ${publicWaterOrSewerLine}, mortage_info = ${mortageInfo},
  back_taxes = ${backTaxes}, asking_price = ${askingPrice}, sliding = ${sliding}, sliding_desc = ${slidingDesc}, heating = ${heating},
  heating_desc = ${heatingDesc}, cooling = ${cooling}, cooling_desc = ${coolingDesc}, floors = ${floors}, floors_desc = ${floorsDesc},
  heating_source = ${heatingSource}, heating_source_desc = ${heatingSourceDesc}, water_source = ${waterSource}, water_source_desc = ${waterSourceDesc},
  sewer_source = ${sewerSource}, sewer_source_desc = ${sewerSourceDesc}, roof = ${roof}, windows = ${windows}, electric = ${electric},
  landscaping = ${landscaping}, kitchen = ${kitchen}, plumbing = ${plumbing}, motivation = ${motivation}, timeframe = ${timeframe}
  WHERE property_guid = ${propertyID} AND is_deleted = 0`;

  let query = db.Query(sql).then(({err, result}) => {
    if (err) {
      return res.status(500).json({
        message: "Error Occured in Inserting Data",
      });
    }
    return res.status(200).json({
      message: "Data has been Successfully Inserted",
    });
  });
});

// ----------------------------------------------------------

//upload picture post route///////////////////////////

const upload = multer({ dest: os.tmpdir() });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },

  // By default, multer removes file extensions so let's add them back
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

router.post("/upload", function (req, res) {
  // req.file contains information of uploaded file
  // req.body contains information of text fields, if there were any
  // console.log(req.form.title)
  // console.log(req.form.file)
  // console.log(req.body.title)
  // console.log(req.file)
  // console.log(req)
  console.log(req.file);
  console.log(req.hello);
  console.log(req.body);
  console.log(req.headers);
  if (req.fileValidationError) {
    return res.send(req.fileValidationError);
  } else if (!req.file) {
    return res.send("Please select an image to upload");
  } else if (err instanceof multer.MulterError) {
    return res.send(err);
  } else if (err) {
    return res.send(err);
  }

  // Display uploaded image for user validation
  res.send(
    `You have uploaded this image: <hr/><img src="${req.file.path}" width="500"><hr /><a href="./">Upload another image</a>`
  );
});

//////////////////////////

router.post("/add-user", checkAuth, (req, res) => {
  let sql1 = `SELECT UserGuid FROM tbl_users WHERE UserEmail = ${db.connection.escape(
    req.body.email
  )}`;
  let query1 = db.Query(sql1).then(({err, result:results}) => {
    try {
      if (err) {
        throw err;
      }
      if (results.length > 0) {
        return res.status(501).json({
          message: "Email Already Exists!",
        });
      } else {
        let userGuid = db.connection.escape(uuidv4());
        let roleGuid = db.connection.escape(uuidv4());
        let password = "abc";
        password = db.connection.escape(md5(password));
        let FullName = db.connection.escape(req.body.firstName + " " + req.body.lastName);
        let Status = db.connection.escape("student");
        let email = db.connection.escape(req.body.email);
        let cnic = db.connection.escape(req.body.cnic);
        let address = db.connection.escape(req.body.address);
        let phone = db.connection.escape(req.body.phone);
        let rollNumber = db.connection.escape(req.body.rollNumber);
        let userImageUrl = db.connection.escape("");
        let sql = `INSERT INTO tbl_users (UserGuid, UserEmail, UserFullName, UserAddress, UserImageUrl, RoleGuid, UserPassword,UserPhone, UserID,UserCnic) VALUES(${userGuid}, ${email}, ${FullName}, ${address}, ${userImageUrl}, ${roleGuid}, ${password}, ${phone}, ${rollNumber}, ${cnic})`;

        try {
          let query = db.Query(sql).then(({err:err1, result:results2}) => {
            if (err1) {
              throw err1;
            }
            let sql1 = `INSERT INTO tbl_roles (RoleGuid, Role) VALUES(${roleGuid}, ${Status})`;
            try {
              let query = db.Query(sql1).then(({err:err2, result:results2}) => {
                if (err2) {
                  throw err2;
                }
                return res.status(201).json({
                  message: "User Added Successfully!",
                });
              });
            } catch (error) {
              return res.status(501).json({
                message: "Not Implemented2!",
              });
            }
          });
        } catch (error) {
          return res.status(501).json({
            message: "Not Implemented2!",
          });
        }
        return res.status(201).json({
          message: "User Added Successfully!",
        });
      }
    } catch (err) {
      return res.status(501).json({
        message: "ERROR: Not Implemented1!",
      });
    }
  });
});
//add teacher
router.post("/add-teacher", checkAuth, (req, res) => {
  let sql1 = `SELECT UserGuid FROM tbl_users WHERE UserEmail = ${db.connection.escape(
    req.body.email
  )}`;
  let query1 = db.Query(sql1).then(({err, result:results}) => {
    try {
      if (err) {
        throw err;
      }
      if (results.length > 0) {
        return res.status(501).json({
          message: "Email Already Exists!",
        });
      } else {
        let userGuid = db.connection.escape(uuidv4());
        let roleGuid = db.connection.escape(uuidv4());
        let password = "abc";
        password = db.connection.escape(md5(password));
        let FullName = db.connection.escape(req.body.firstName + " " + req.body.lastName);
        let Status = db.connection.escape("teacher");
        let email = db.connection.escape(req.body.email);
        let cnic = db.connection.escape(req.body.cnic);
        let address = db.connection.escape(req.body.address);
        let phone = db.connection.escape(req.body.phone);
        let employeeID = db.connection.escape(req.body.employeeID);
        let userImageUrl = db.connection.escape("url");
        let sql = `INSERT INTO tbl_users (UserGuid, UserEmail, UserFullName, UserAddress, UserImageUrl, RoleGuid, UserPassword,UserPhone, UserID,UserCnic) VALUES(${userGuid}, ${email}, ${FullName}, ${address}, ${userImageUrl}, ${roleGuid}, ${password}, ${phone}, ${employeeID}, ${cnic})`;

        try {
          let query = db.Query(sql).then(({err:err1, result:results2}) => {
            if (err1) {
              throw err;
            }
            let sql1 = `INSERT INTO tbl_roles (RoleGuid, Role) VALUES(${roleGuid}, ${Status})`;
            try {
              let query = db.Query(sql1).then(({err:err1, result:results2}) => {
                if (err1) {
                  throw err;
                }
                return res.status(201).json({
                  message: "User Added Successfully!",
                });
              });
            } catch (error) {
              return res.status(501).json({
                message: "Not Implemented2!",
              });
            }
          });
        } catch (error) {
          return res.status(501).json({
            message: "Not Implemented2!",
          });
        }
      }
    } catch (err) {
      return res.status(501).json({
        message: "ERROR: Not Implemented1!",
      });
    }
  });
});

//add announcement
router.post("/add-announcement", checkAuth, (req, res) => {
  console.log("okayy");

  if (req.userData.Role == "teacher") {
    let inclusions = ["pdf", "png", "jpeg"];
    let fileNames = [];
    let filePrefix = "";

    console.log("totalFiles = ", req.body.files.length);
    for (let i = 0; i < req.body.files.length; i++) {
      let fileName = uuidv4();
      let string = req.body.files[i];

      var regex = /^data:.+\/(.+);base64,(.*)$/;

      filePrefix +=
        req.body.files[i].split(",")[0].split(";")[0].split(":")[1] + " ";
      var matches = string.match(regex);
      var ext = matches[1];
      var data = matches[2];
      console.log("files: ", ext);
      if (inclusions.includes(ext)) {
        fileNames.push("Uploads/Materials/" + fileName + "." + ext);

        var buffer = Buffer.from(data, "base64");
        fs.writeFileSync("Uploads/Materials/" + fileName + "." + ext, buffer);
      } else {
        return res.status(501).json({
          message: "Wrong File Extension",
        });
      }
    }
    filePrefix = filePrefix.substring(0, filePrefix.length - 1);
    filePrefix = db.connection.escape(filePrefix);
    console.log("file success");
    let classroomGuid = db.connection.escape(req.body.classGuid);
    let sql0 = `SELECT * FROM tbl_teachers t INNER JOIN tbl_classrooms c ON c.ClassroomGuid=t.ClassroomGuid WHERE t.UserGuid=${db.connection.escape(
      req.userData.UserGuid
    )} AND c.ClassroomGuid=${classroomGuid} AND t.IsDeleted='0' AND c.IsDeleted='0'`;
    try {
      let query0 = db.Query(sql0).then((err0, result0) => {
        if (err0) {
          throw err0;
        }

        let contentGuid = db.connection.escape(uuidv4());
        let teacherGuid = db.connection.escape(result0[0].TeacherGuid);
        let contentType = db.connection.escape("Material");
        let sql = `INSERT INTO tbl_content (ContentGuid, ContentType, ClassroomGuid, TeacherGuid) values(${contentGuid}, ${contentType}, ${classroomGuid}, ${teacherGuid})`;

        try {
          let query = db.Query(sql).then(({err:err1, result:results2}) => {
            if (err1) {
              throw err1;
            }
            console.log("added content");
            let materialGuid = db.connection.escape(uuidv4());
            let materialTitle = db.connection.escape(req.body.title);
            let materialDescription = db.connection.escape(req.body.description);
            let materialURL = db.connection.escape(fileNames.join(" "));
            let sql1 = `INSERT INTO tbl_materials (MaterialGuid, MaterialTitle, MaterialDesc, MaterialFileURL, ContentGuid, MaterialFilePrefix) values (${materialGuid}, ${materialTitle}, ${materialDescription}, ${materialURL}, ${contentGuid}, ${filePrefix})`;
            try {
              let query2 = db.Query(sql1).then(({err:err2, result:results2}) => {
                if (err2) {
                  throw err2;
                }
                console.log("added material");
                return res.status(201).json({
                  message: "Announcement Added Successfully!",
                });
              });
            } catch (err) {
              return res.status(501).json({
                message: "ERROR: Not Implemented!",
              });
            }
          });
        } catch (error) {
          return res.status(501).json({
            message: "Not Implemented2!",
          });
        }
      });
    } catch (error) {
      return res.status(501).json({
        message: "Not Implemented2!",
      });
    }
  } else {
    return res.status(401).json({
      message: "Auth Failed!",
    });
  }
});
router.post("/add-lecture-to-class", checkAuth, (req, res) => {
  let lectureGuid = db.connection.escape(uuidv4());
  let classroomGuid = db.connection.escape(req.body.classGuid);
  let teacherGuid = db.connection.escape(req.userData.UserGuid);
  let lecture = db.connection.escape(req.body.lecture);
  let lectureDesc = db.connection.escape(req.body.lectureDesc);
  let lectureDate = db.connection.escape(new Date(req.body.lectureDate));

  let sql = `INSERT INTO tbl_lectures (LectureGuid, LectureName, LectureDesc, LectureDate, TeacherGuid, ClassroomGuid) VALUES(${lectureGuid}, ${lecture}, ${lectureDesc}, ${lectureDate}, ${teacherGuid}, ${classroomGuid})`;

  try {
    let query = db.Query(sql).then(({err:err1, result:results2}) => {
      if (err1) {
        throw err1;
      }
      let attendanceGuid = db.connection.escape(uuidv4());
      let sql1 = `INSERT into tbl_attendance(AttendanceGuid, LectureGuid, ClassroomGuid) VALUES (${attendanceGuid}, ${lectureGuid}, ${classroomGuid})`;
      try {
        let q1 = db.Query(sql1).then(({err, result}) => {
          if (err) {
            throw err;
          }
          return res.status(201).json({
            message: "Lecture Added Successfully!",
          });
        });
      } catch (err2) {
        return res.status(501).json({
          message: "Attendance Error!",
        });
      }
    });
  } catch (error) {
    return res.status(501).json({
      message: "Not Implemented2!",
    });
  }
});

// add Teacher to classroom
router.post("/add-teacher-to-class", checkAuth, (req, res) => {
  let classroomGuid = db.connection.escape(req.body.classGuid);
  let teacher = req.body.teachers;

  for (let i = 0; i < teacher.length; i++) {
    let teacherGuid = db.connection.escape(uuidv4());
    let teacherUserGuid = db.connection.escape(teacher[i]);
    let sql = `INSERT INTO tbl_teachers (TeacherGuid, ClassroomGuid, UserGuid) VALUES(${teacherGuid}, ${classroomGuid}, ${teacherUserGuid})`;

    try {
      let query = db.Query(sql).then(({err:err1, result:results2}) => {
        if (err1) {
          throw err;
        }
      });
    } catch (error) {
      return res.status(501).json({
        message: "Not Implemented2!",
      });
    }
  }
  return res.status(201).json({
    message: "Teachers Added Successfully!",
  });
});

// add lecture
router.post("/add-lecture", checkAuth, (req, res) => {
  let classroomGuid = db.connection.escape(req.body.classGuid);
  let lectureName = db.connection.escape(req.body.lectureName);
  let lectureDesc = db.connection.escape(req.body.lectureDesc);
  let lectureDate = db.connection.escape(req.body.lectureDate);
  let teacherGuid = db.connection.escape(req.userGuid);
  let lectureGuid = db.connection.escape(uuidv4());
  let sql = `INSERT INTO tbl_lectures(LectureGuid, LectureName, LectureDesc, LectureDate, ClassroomGuid) VALUES(${lectureGuid}, ${lectureName}, ${lectureDesc}, ${lectureDate}, ${classroomGuid})`;

  try {
    let query = db.Query(sql).then(({err:err1, result:results2}) => {
      if (err1) {
        throw err;
      }
      return res.status(501).json({
        message: "Added Successfully!",
      });
    });
  } catch (error) {
    return res.status(501).json({
      message: "Not Implemented2!",
    });
  }
});

// add Student attendance
router.post("/add-attendance", checkAuth, (req, res) => {
  let classroomGuid = db.connection.escape(req.body.classGuid);
  let lectureGuid = db.connection.escape(req.body.lectureGuid);
  let attendanceGuid = db.connection.escape(uuidv4());
  let sql = `INSERT INTO tbl_attendance (AttendanceGuid, LectureGuid, ClassroomGuid) VALUES(${attendanceGuid}, ${lectureGuid}, ${classroomGuid})`;

  try {
    let query = db.Query(sql).then(({err:err1, result:results2}) => {
      if (err1) {
        throw err;
      }
    });
  } catch (error) {
    return res.status(501).json({
      message: "Not Implemented2!",
    });
  }
});

// add Student to classroom
router.post("/add-students-to-class", checkAuth, (req, res) => {
  let classroomGuid = db.connection.escape(req.body.classGuid);
  let students = req.body.students;

  for (let i = 0; i < students.length; i++) {
    let participantGuid = db.connection.escape(uuidv4());
    let studentGuid = db.connection.escape(students[i]);
    let sql = `INSERT INTO tbl_participants (ParticipantGuid, ClassroomGuid, UserGuid) VALUES(${participantGuid}, ${classroomGuid}, ${studentGuid})`;

    try {
      let query = db.Query(sql).then(({err:err1, result:results2}) => {
        if (err1) {
          throw err;
        }
      });
    } catch (error) {
      return res.status(501).json({
        message: "Not Implemented2!",
      });
    }
  }
  return res.status(201).json({
    message: "Students Added Successfully!",
  });
});

//add classroom
router.post("/add-classroom", checkAuth, (req, res) => {
  let sql1 = `SELECT ClassroomGuid FROM tbl_classrooms WHERE ClassroomName = ${db.connection.escape(
    req.body.classroomName
  )} AND IsDeleted = '0'`;
  let query1 = db.Query(sql1).then(({err, result:results}) => {
    try {
      if (err) {
        throw err;
      }
      if (results.length > 0) {
        return res.status(501).json({
          message: "Classroom Already Exists!",
        });
      } else {
        let classroomGuid = db.connection.escape(uuidv4());
        let classroomName = db.connection.escape(req.body.classroomName);
        let classroomDesc = db.connection.escape(req.body.classroomDesc);
        let classroomCapacity = db.connection.escape(req.body.classroomCapacity);
        let sql = `INSERT INTO tbl_classrooms (ClassroomGuid, ClassroomName, ClassroomDesc, ClassroomCapacity) VALUES(${classroomGuid}, ${classroomName}, ${classroomDesc}, ${classroomCapacity})`;

        try {
          let query = db.Query(sql).then(({err:err1, result:results2}) => {
            if (err1) {
              throw err;
            }

            return res.status(201).json({
              message: "Classroom Added Successfully!",
            });
          });
        } catch (error) {
          return res.status(501).json({
            message: "Not Implemented2!",
          });
        }
      }
    } catch (err) {
      return res.status(501).json({
        message: "ERROR: Not Implemented1!",
      });
    }
  });
});

// WORKBASE ROUTES
////////////////////////////////////////////////////////////////
router.post("/InsertEmployees", checkAuth, (req, res) => {
  let user_guid = db.connection.escape(uuidv4());
  let contact_guid = db.connection.escape(uuidv4());
  let contact_guid_two = db.connection.escape(uuidv4());
  let contact_guid_three = db.connection.escape(uuidv4());
  let email_guid = db.connection.escape(uuidv4());
  let email_guid_two = db.connection.escape(uuidv4());
  let email_guid_three = db.connection.escape(uuidv4());
  let firstname = db.connection.escape(req.body.FirstName);
  let middlename = db.connection.escape(req.body.MiddleName);
  let lastName = db.connection.escape(req.body.LastName);
  let nationality = db.connection.escape(req.body.Nationality);
  let qualification = db.connection.escape(req.body.Qualification);
  let contact = db.connection.escape(req.body.Contact);
  let contactTwo = db.connection.escape(req.body.ContactTwo);
  let contactThree = db.connection.escape(req.body.ContactThree);
  let email = db.connection.escape(req.body.Email);
  let emailTwo = db.connection.escape(req.body.EmailTwo);
  let emailThree = db.connection.escape(req.body.EmailThree);
  let vaccinationName = db.connection.escape(req.body.VaccinationName);
  let vaccinationDate = db.connection.escape(req.body.VaccinationDate);
  let vaccinationDesc = db.connection.escape(req.body.VaccinationDescription);
  let workingStatus = db.connection.escape("Working");
  let photoUrl = db.connection.escape(req.body.Image);
  let DefaultVal = 1;
  console.log({ contactTwo, contactThree, emailTwo, emailThree });
  let sql = `INSERT INTO tbl_users (UserGuid, FirstName, MiddleName, LastName, Nationality, PhotoURL, Qualification, Status) VALUES (${user_guid},${firstname},${middlename},${lastName},${nationality},${photoUrl},${qualification},${workingStatus});`; //query

  try {
    let query = db.Query(sql).then(({err, result:results}) => {
      if (err) {
        res.status(501).json({
          message: "User Table Error",
        });
        console.log("Error in User Table", err);
        return;
      }
      console.log(results);
      //contact
      let sql1 = `INSERT INTO tbl_contacts(ContactGuid, UserGuid, Contact, IsDefault) VALUES (${contact_guid}, ${user_guid}, ${contact}, ${DefaultVal});`;

      try {
        let query1 = db.Query(sql1).then(({err:err1, result:results1}) => {
          if (err1) {
            res.status(501).json({
              message: "Contact Table Error",
            });
            console.log("Error in Contacts Table");
            return;
          }
          console.log(results1);
          if (contactTwo != "''") {
            let sql_c2 = `INSERT INTO tbl_contacts(ContactGuid, UserGuid, Contact) VALUES (${contact_guid_two}, ${user_guid}, ${contactTwo});`;
            try {
              let query = db.Query(sql_c2).then(({err, result:results}) => {
                if (err) {
                  res.status(501).json({
                    message: "Contact Table Error 2",
                  });
                  console.log("Error in Contacts Table 2");
                  return;
                }
              });
            } catch (error) {
              res.status(501).json({
                message: "Contact Table Error 2",
              });
            }
          }
          if (contactThree != "''") {
            let sql_c3 = `INSERT INTO tbl_contacts(ContactGuid, UserGuid, Contact) VALUES (${contact_guid_three}, ${user_guid}, ${contactThree});`;
            try {
              let query = db.Query(sql_c3).then(({err, result:results}) => {
                if (err) {
                  res.status(501).json({
                    message: "Contact Table Error 3",
                  });
                  console.log("Error in Contacts Table 3");
                  return;
                }
              });
            } catch (error) {
              res.status(501).json({
                message: "Contact Table Error 3",
              });
            }
          }

          //email
          let sql2 = `INSERT INTO tbl_emails(EmailGuid, UserGuid, Email, IsDefault) VALUES (${email_guid}, ${user_guid}, ${email}, ${DefaultVal});`;

          try {
            let query2 = db.Query(sql2).then(({err:err2, result:results2}) => {
              if (err2) {
                res.status(501).json({
                  message: "Email Table Error",
                });
                console.log("Error in Email Table");
                return;
              }

              //here query for these two emails
              if (emailTwo != "''") {
                let sql_e2 = `INSERT INTO tbl_emails(EmailGuid, UserGuid, Email) VALUES (${email_guid_two}, ${user_guid}, ${emailTwo});`;
                try {
                  let query = db.Query(sql_e2).then(({err, result:results}) => {
                    if (err) {
                      res.status(501).json({
                        message: "Contact Email Error 2",
                      });
                      console.log("Error in Emails Table 2");
                      return;
                    }
                  });
                } catch (error) {
                  res.status(501).json({
                    message: "Contact Email Error 2",
                  });
                }
              }
              if (emailThree != "''") {
                let sql_e3 = `INSERT INTO tbl_emails(EmailGuid, UserGuid, Email) VALUES (${email_guid_three}, ${user_guid}, ${emailThree});`;
                try {
                  let query = db.Query(sql_e3).then(({err, result:results}) => {
                    if (err) {
                      res.status(501).json({
                        message: "Email Table Error 3",
                      });
                      console.log("Error in Emails Table 3");
                      return;
                    }
                  });
                } catch (error) {
                  res.status(501).json({
                    message: "Email Table Error 3",
                  });
                }
              }

              ////////////// vaccination insertion
              if (vaccinationName != "''" && vaccinationDate != "''") {
                let sql = `INSERT INTO tbl_vaccines(UserGuid, VaccineName, VaccineDescription, VaccineDate ) VALUES (${user_guid}, ${vaccinationName}, ${vaccinationDesc}, ${vaccinationDate});`;
                try {
                  let query = db.Query(sql).then(({err, result:results}) => {
                    if (err) {
                      res.status(501).json({
                        message: "Vaccination Table Error ",
                      });
                      console.log("Vaccination in Emails Table ");
                      return;
                    }
                  });
                } catch (error) {
                  res.status(501).json({
                    message: "Vaccination Table Error",
                  });
                }
              }
            });
          } catch (error) {
            res.status(501).json({
              message: "Problem in Email Table",
            });
            console.log("Error in Emails Table");
          }
        });
      } catch (error) {
        res.status(501).json({
          message: "Problem in Contact Table",
        });
        console.log("Error in Contacts Table");
      }
      res.status(201).json({
        message: "Insert Done Successfully",
      });
      return;
    });
  } catch (error) {
    res.status(501).json({
      message: "Problem in User Table Query",
    });
    console.log("Error in User Table");
  }
});

module.exports = router;
