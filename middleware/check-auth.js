const jwt = require("jsonwebtoken");
const process1 = require("./../config/env-config.json");
const db = require("../config/config").getConnection();
module.exports = (req, res, next) => {
  const userGuid = req.headers.authorization.split(" ")[2];
  const token = req.headers.authorization.split(" ")[1];
  console.log({userGuid, token})
  let JWT_KEY = "";

  let sql = `SELECT secret_key FROM users WHERE user_guid = ${db.escape(
    userGuid
  )} AND is_deleted='0'`;
  let query = db.query(sql, (err, results) => {
    if (results.length <= 0) {
      return res.status(401).json({ message: "Auth Failed" });
    }
    JWT_KEY = results[0].secret_key;
    if (JWT_KEY) {
      try {
        const decoded = jwt.verify(token, JWT_KEY);
        let userData = `SELECT * FROM users WHERE user_guid = ${db.escape(
          userGuid
        )} AND is_deleted='0'`;
        let query1 = db.query(userData, (err, response) => {
          if (response.length > 0) {
            req.userData = response[0];
            req.body = req.body;
            next();
          } else {
            return res.status(401).json({
              message: "Auth Failed",
            });
          }
        });
      } catch (error) {
        return res.status(401).json({
          message: "Auth Failed",
        });
      }
      // req.userData = decoded;
    } else {
      return res.status(401).json({
        message: "Auth Failed",
      });
    }
  });
};
