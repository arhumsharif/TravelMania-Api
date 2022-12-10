var express = require("express");
var router = express.Router();
const fs = require("fs");
const path = require("path");
const checkAuth = require("../../middleware/check-auth");
const ampq = require("amqplib/callback_api");

/* GET home page. */

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

router.get("/", checkAuth, function (req, res) {
  // read param
  const filename = req.userData.profile;
  // remove extension
  const filenameWithoutExtension = filename.split(".")[0];
  // get only extention
  const extension = path.extname(filename);
  // print filename and extension
  console.log(filenameWithoutExtension, extension);
  // check if file exists
  const filePath = path.join(__dirname, filename);
  if (fs.existsSync(filePath)) {
    // convert file to base64 string
    const file = fs.readFileSync(filePath, "base64");
    // send file as base64 string
    res.status(200).send({ title: filename, file: file });
  } else res.send({ title: "File not sent" });
});

router.get("/:filename", checkAuth, function (req, res) {
  // read param
  const filename = req.params.filename;
  // remove extension
  const filenameWithoutExtension = filename.split(".")[0];
  // get only extention
  const extension = path.extname(filename);
  // print filename and extension
  console.log(filenameWithoutExtension, extension);
  // check if file exists
  const filePath = path.join(__dirname, filename);
  if (fs.existsSync(filePath)) {
    // convert file to base64 string
    const file = fs.readFileSync(filePath, "base64");
    // send file as base64 string
    res.status(200).send({ title: filename, file: file });
  } else res.send({ title: "File not sent" });
});

router.post("/", checkAuth, function (req, res) {
  // check if file exists
  const base64File = req.body.file;
  // send file as base64 string
  RequestServer("/someFile.png", base64File);
  res.status(200).send({ title: "File sent", file: file });
});

module.exports = router;
