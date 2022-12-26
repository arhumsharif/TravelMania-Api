const db = require("./../../config/config").getConnection();
var md5 = require("md5");
const { v4: uuidv4 } = require("uuid");
const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
// Secret Key generator
function getSecretKey() {
  var randomChars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var result = "";
  for (var i = 0; i < 8; i++) {
    result += randomChars.charAt(
      Math.floor(Math.random() * randomChars.length)
    );
  }
  return result;
}
// authenticate
router.post("/",async (req, res) => {
  let email = db.escape(req.body.Email);
  let password = db.escape(md5(req.body.Password));
  let sql = `SELECT * FROM users where email = ${email} AND password = ${password}`;
  let quedminry = db.query(sql, (err, result) => {

    if(err){
      return res.status(401).json({
        message: "Auth Failed1!",
      });
    }

    if (result.length < 1) {
      res.status(401).json({
        message: "Auth Failed1!",
      });
      return;
    }
    if (result) {
      const secretKey = getSecretKey();
      let secretKeyQuery = `UPDATE users SET secret_key = ${db.escape(
        secretKey
      )} WHERE user_guid=${db.escape(result[0].user_guid)}`;
      let updateSecretKey = db.query(secretKeyQuery, (err1, response1) => {
        console.log(err1, response1)
        if (err1) {
          res.status(401).json({
            message: "Auth Failed!2",
          });
          return;
        }

        const token = jwt.sign(
          {
            user_guid: result[0].user_guid,
            email: result[0].email,
          },
          secretKey,
          {
            expiresIn: "1h",
          }
        );

        if (result[0].user_type == "Tour Guide")
        {
          return res.status(200).json({
            message: "Auth Successfull",
            token: token + " " + result[0].user_guid,
            role: 1
          });
        }

        if (result[0].user_type == "Organization")
        {
          return res.status(200).json({
            message: "Auth Successfull",
            token: token + " " + result[0].user_guid,
            role: 2
          });
        }

        return res.status(200).json({
          message: "Auth Successfull",
          token: token + " " + result[0].user_guid,
          role: 0
        });
      });
    } else {
      res.status(401).json({
        message: "Auth Failed!4",
      });
      return;
    }
  });
});
module.exports = router;
