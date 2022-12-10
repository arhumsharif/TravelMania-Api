const mysql = require("mysql");
const env = require("./env-config.json");
//create connection
// port: env.dbhost.port,
// local is false
let local = false;
let vars;
if (local == true) {
  vars = {
    host: env.dbhost.host,
    user: env.dbhost.user,
    password: env.dbhost.password,
    database: env.dbhost.database,
  };
} else {
  vars = {
    host: env_server.dbhost.host,
    user: env_server.dbhost.user,
    password: env_server.dbhost.password,
    database: env_server.dbhost.database,
  };
}

var colors          = require('colors');
var q               = require('q');
var MySQLConnection = {};

MySQLConnection.connect = function(){
    var d = q.defer();
    MySQLConnection.connection = mysql.createConnection(vars);

    MySQLConnection.connection.connect(function (err) {
        if(err) {
            console.log('Not connected '.red, err.toString().red, ' RETRYING...'.blue);
            d.reject();
        } else {
            console.log('Connected to Mysql. Exporting..'.blue);
            d.resolve(MySQLConnection.connection);
        }
    });
    return d.promise;
};

MySQLConnection.createPool = function(){
  MySQLConnection.pool = mysql.createPool(vars);
}

MySQLConnection.createPool();
MySQLConnection.connect().then(function(con){
  console.log('connected!');
  let mysql1 = con;
  mysql1.on('error', function (err, result) {
    console.log('error occurred. Reconneting...'.purple);
    MySQLConnection.reconnect();
  });
});

MySQLConnection.Query = function(thisQuery, func){
  console.log(thisQuery.green)
  let p = new Promise((resolve)=>{
    MySQLConnection.pool.getConnection(function(err, con){
      console.log('connected!');
      con.query(thisQuery, function(err, result){
        if(err){
          con.release();
          resolve({err:err, result:null})
        }
        con.release();
        resolve({err:null, result:result})
      });
    });
  });
  return p.then((data)=>{return data;});
}

MySQLConnection.Query1 = function(thisQuery, func){
  console.log(thisQuery.green)
  let p = new Promise((resolve)=>{
    MySQLConnection.connect().then(function(con){
      console.log('connected!');
      let mysql1 = con;
      mysql1.on('error', function (err, result) {
        console.log('error occurred. Reconneting...'.purple);
        MySQLConnection.reconnect();
      });
      mysql1.query(thisQuery, function(err, result){
        if(err){
          resolve({err:err, result:null})
        }
        resolve({err:null, result:result})
      });
    });
  });
  return p.then((data)=>{return data;});
}

MySQLConnection.reconnect = function(){
  console.log("reconnecting".red);
    MySqlConnection.connect().then(function(con){
      console.log("connected. getting new reference");
        let mysql1 = con;
        mysql1.on('error', function (err, result) {
          console.log("Trying Again!!".red);
            MySQLConnection.reconnect();
        });
    }, function (error) {
      console.log("try again");
        setTimeout(MySQLConnection.reconnect, 2000);
    });
};

module.exports = MySQLConnection;
