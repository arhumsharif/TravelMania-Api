const express = require("express");
const multer = require("multer");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
//use the package

// Put these statements before you define any routes.
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

app.use(bodyParser({ limit: "50mb" }));
app.use(express.json());
app.use(express.static("public"));
// middleware
app.use(bodyParser.json({ limit: "50mb", extended: true }));
app.use(cors({
    origin: '*'
}));
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

app.get("/", (req, res) => {
  res.send("Listening for requests...");
});
//get routes
const getRoute = require("./modules/Get");
app.use("/get", getRoute);
//get routes
const authRoute = require("./modules/auth/authenticate");
app.use("/authenticate", authRoute);
//post routes
const postRoute = require("./modules/Post");
app.use("/post", postRoute);
//Pull routes
const pullRoute = require("./modules/Put");
app.use("/put", pullRoute);

// const fileRoute = require("./modules/Files/upload");
// app.use("/uploadFile", fileRoute);
//Delete routes
const deleteRoute = require("./modules/Delete");
app.use("/delete", deleteRoute);
app.use(function (req, res, next) {
  var err = new Error("Not Found");
  err.status = 404;
  next(err);
});
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`API started successfully at http://localhost:${port}`);
});
