let nodemailer = require("nodemailer");
require("dotenv").config();
var hbs = require("nodemailer-express-handlebars");
let environment = process.env;
var path = require("path");

var transporter = nodemailer.createTransport({
  service: environment.EMAIL_SERVICE_NAME,
  host: environment.EMAIL_SERVICE_HOST,
  secure: environment.EMAIL_SERVICE_SECURE,
  port: environment.EMAIL_SERVICE_PORT,
  auth: {
    user: environment.EMAIL_USER_NAME,
    pass: environment.EMAIL_USER_PASSWORD,
  },
  logger: true,
  debug: false, // include SMTP traffic in the logs
});

module.exports.sendMail = (mailOptions) => {
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log("Error occurred");
      console.log(error.message);
    }
    console.log(
      "nodemailer.getTestMessageUrl(info)",
      nodemailer.getTestMessageUrl(info)
    );
    console.log("[mail:info]: ", info);

    return nodemailer.getTestMessageUrl(info);
  });
};
