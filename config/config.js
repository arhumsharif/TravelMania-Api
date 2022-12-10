const mysql = require("mysql");
const env = require("./env-config.json");

let local = true;
let vars;
if (local == true) {
  vars = {
    host: env.dbhost.host,
    user: env.dbhost.user,
    password: env.dbhost.password,
    database: env.dbhost.database,
  };
}

module.exports.getConnection = function () {
  // Test connection health before returning it to caller.
  if (
    module.exports.connection &&
    module.exports.connection._socket &&
    module.exports.connection._socket.readable &&
    module.exports.connection._socket.writable
  ) {
    return module.exports.connection;
  }
  console.log(
    (module.exports.connection ? "UNHEALTHY SQL CONNECTION; RE" : "") +
      "CONNECTING TO SQL."
  );
  var connection = mysql.createConnection(vars);
  connection.connect(function (err) {
    if (err) {
      console.log("SQL CONNECT ERROR: " + err);
    } else {
      console.log("SQL CONNECT SUCCESSFUL.");
    }
  });
  var interval = setInterval(function () {
    connection.ping();
    console.log("ping successfull");
  }, 30000);

  connection.on("close", function (err) {
    console.log("SQL CONNECTION CLOSED.");
  });
  connection.on("error", function (err) {
    console.log("SQL CONNECTION ERROR: " + err);
  });
  module.exports.connection = connection;
  return module.exports.connection;
};

// Open a connection automatically at app startup.
module.exports.getConnection();
