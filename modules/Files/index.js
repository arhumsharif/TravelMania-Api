const express = require("express");
const multer = require("multer");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const app = express();
const fs = require("fs");
const ampq = require("amqplib/callback_api");
//use the package

// Put these statements before you define any routes.
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

// @route   POST api/media/
// @desc    Create a new media
// @access  Private
// app.post(
//   "/up",
//   (req, res) => {
//     const data = req.files;
//     return res.json({ success: true, data: data });
//   }
// );

app.use(bodyParser({ limit: "50mb" }));
app.use(express.json());
app.use(express.static("public"));
// middleware
app.use(bodyParser.json({ limit: "50mb", extended: true }));
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(express.static(__dirname + "/public"));
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "DELETE, PUT, GET, POST");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Credentials", false);
  next();
});

ampq.connect("amqp://localhost", (err, conn) => {
  conn.createChannel((err, ch) => {
    const q = "file";
    ch.assertQueue(q, { durable: false });
    ch.consume(
      q,
      async (msg) => {
        const { file, filename } = JSON.parse(await msg.content.toString());
        let base64Data = file.slice(1, file.length - 1);
        base64Data = base64Data.split("base64,")[1];
        const filePath = path.join(__dirname, filename);
        fs.writeFileSync(filePath, base64Data, "base64");
      },
      { noAck: true }
    );
  });
});

const port = process.env.PORT || 5001;
app.listen(port, () => {
  console.log(`API started successfully at http://localhost:${port}`);
});
