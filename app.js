const express = require("express");
const app = express();
const morgan = require("morgan");
const bodyParser = require("body-parser");
const port = 80;
const host = "0.0.0.0"
require("dotenv").config();


const fs = require("fs");
const cors = require("cors");
const https = require("https");
const http = require("http");
//const redisClient = path.join(__dirname, "./configuration/redis_config.js");

// const redis = require('redis');
// const client = redis.createClient({
//     host: '10.142.15.206',
//     port: 6379,
//     //password: 'Ru01G27aKJNiNMA'
// });

// client.on('connect', () => {
//   console.log('Redis Client Connected');
// });
// client.on('error', (err) => console.log('Redis Client Error', err));
// client.connect();

// await client.HSET('key', 'field', 'value');

//now we setup server

// const httpServer = http.createServer(app);
// httpServer.listen(port, () => {
//  console.log("HTTP Server running on port" + " " + port);
// });

//routes which handle api requests

const users = require("./api/routes/users");
const admin = require("./api/routes/admin");
const external_calls = require("./api/routes/external_calls");


app.use(morgan("dev"));
app.use(bodyParser.json({ limit: "80mb" }));
app.use(
  bodyParser.urlencoded({
    limit: "80mb",
    extended: true,
    parameterLimit: 90000,
  })
);
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin,Cache-Control,Accept,X-Access-Token ,X-Requested-With, Content-Type, Access-Control-Request-Method"
  );
  next();
});
app.use(cors());
app.options("*", cors());

app.use("/", users);
app.use("/admin", admin);
app.use("/external_calls", external_calls);

app.use((req, res, next) => {
  const error = new Error("Not Found");
  error.status = 404;
  next(error);
});
app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message,
    },
  });
});

let key = "";
let certificate = "";
let ca = "";

 if (process.env.NODE_ENV == "production") {
   key = fs.readFileSync("/etc/letsencrypt/live/cnam.tcpaas.com/privkey.pem");
   certificate = fs
     .readFileSync("/etc/letsencrypt/live/cnam.tcpaas.com/cert.pem")
     .toString();
   ca = fs.readFileSync("/etc/letsencrypt/live/cnam.tcpaas.com/fullchain.pem");
 } else {
   key = fs.readFileSync("/etc/letsencrypt/live/cnam.tcpaas.com/privkey.pem");
   certificate = fs
     .readFileSync("/etc/letsencrypt/live/cnam.tcpaas.com/cert.pem")
     .toString();
   ca = fs.readFileSync("/etc/letsencrypt/live/cnam.tcpaas.com/fullchain.pem");
 }

 const credentials = {
   key: key,
   ca: ca,
   cert: certificate,
 };
 const httpsServer = https.createServer(credentials, app);
 httpsServer.listen(port, host, () => {
   console.log("Node Server running on port" + " " + port);
 });


