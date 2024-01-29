let jwt = require("jsonwebtoken");
const path = require("path");
const configfile = path.join(__dirname, "../../configuration/config.js");
const sql = require(configfile);
const fs = require("fs");
//var nodemailer = require("nodemailer");
const Handlebars = require("handlebars");
var fs_copy = require("fs-extra");
let environment = process.env;
const moment = require("moment");
const { JSDOM } = require("jsdom");
const jsdom = new JSDOM();
// Set window and document from jsdom
const { window } = jsdom;
const { document } = window;
// Also set global window and document before requiring jQuery
global.window = window;
global.document = document;

const $ = (global.jQuery = require("jquery"));

let validateAccount = async (req, res, next) => {
 
  
  const accountCheck = await sqlQuery(
    "SELECT * FROM api_accounts WHERE token = ? AND account=?",
    [req.body.token, req.body.api_accountno]
  );

  if (accountCheck.length > 0) {
    next();
  } else {
    return res.json({ status: 404, errors: "INVALID API ACCOUNTNO AND TOKENS"});
  }
};

let validateAccountInner = async (req, res, next) => {
 
  
  const accountCheck = await sqlQuery(
    "SELECT * FROM api_accounts WHERE token = ? AND account=?",
    [req.body.token, req.body.api_accountno]
  );

  if (accountCheck.length > 0) {
    return true;
  } else {
    return false;
  }
};

let validateAccountSimple = async (req, res, next) => {
  const accountCheck = await sqlQuery(
    "SELECT * FROM api_accounts WHERE token = ? AND account=?",
    [req.body.token, req.body.api_accountno]
  );

  if (accountCheck.length > 0) {
    next();
  } else {
    return res.json({ status: 404, errors: "INVALID API ACCOUNTNO AND TOKENS"});
  }
};

let validateAccountSettings = async (req, res, next) => {
  const accountCheck = await sqlQuery(
    "SELECT * FROM tbl_user_settings WHERE accountno=?",
    [req.body.token, req.body.api_accountno]
  );

  if (accountCheck.length > 0) {
    next();
  } else {
    return res.json({ status: 406, errors: "ACCOUNT SETTINGS ARE MISSING"});
  }
};

let sqlQuery = (query, params) => {
  return new Promise((resolve, reject) => {
    sql.query(query, params, (err, result) => {

      if (err) return reject(err);
      resolve(result);
    });
  });
};

let jwtVerify = (bearerToken) => {
  try {
    return new Promise((resolve, reject) => {
      jwt.verify(bearerToken, process.env.SECRETJWT, function (err, decoded) {
        if (err) {
          resolve("Expired");
        } else {
          resolve(decoded);
        }
      });
    });
  } catch (err) {
    console.log("catch: ", err);
  }
};

let verifyToken = async (req, res, next) => {
  const bearerHeader = req.headers["authorization"];
  
  if (typeof bearerHeader != "undefined") {
    const bearer = bearerHeader.split(" ");
    const bearerToken = bearer[1];
    let decoded = await jwtVerify(bearerToken);

    if (decoded === "Expired") {
      res.json({
        status: 403,
        errors: "jwt expired",
      });
    } else if (decoded.accountno === req.body.accountno) {
      next();
    } else {
      res.json({
        status: 403,
        errors: "authentication missing",
      });
    }
  } else {
    res.json({
      status: 403,
      errors: "authentication missing",
    });
  }
};

let emailSendRegister = async (
  toEmail,
  subject,
  tempData,
  client_name,
  sign_up_date,
  token,
  reseller_name,
  reseller_logo
) => {
  var template = Handlebars.compile(tempData);
  
  var options = (locals) => {
    return {
      from: '"'+reseller_name+'" <'+environment.FROM_EMAIL+'>',
      to: toEmail,
      subject: subject +" - "+reseller_name,
      html: template(locals),
    };
  };
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
    debug: false,
  });
  transporter.sendMail(
    options({
      comp_name: reseller_name,
      comp_logo: reseller_logo,
      support_email: environment.COMP_SUPPORT_EMAIL,
      client_name: client_name,
      signup_link: token,
      sign_up_date: sign_up_date,
    }),
    function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    }
  );
};

let emailSendRevoke = async (
  toEmail,
  subject,
  tempData,
  sign_up_date,
  reseller_name,
  reseller_logo,
  sign_agreement_link,
  revoke_reason,
  name
) => {
  var template = Handlebars.compile(tempData);
  
  var options = (locals) => {
    return {
      from: '"'+reseller_name+'" <'+environment.FROM_EMAIL+'>',
      to: toEmail,
      subject: subject +" - "+reseller_name,
      html: template(locals),
    };
  };
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
    debug: false,
  });
  transporter.sendMail(
    options({
      comp_name: reseller_name,
      comp_logo: reseller_logo,
      support_email: environment.COMP_SUPPORT_EMAIL,
      sign_up_date: sign_up_date,
      sign_agreement_link: sign_agreement_link,
      revoke_reason: revoke_reason,
      client_name: name
    }),
    function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    }
  );
};

let emailSendClientRevoke = async (
  toEmail,
  subject,
  tempData,
  sign_up_date,
  reseller_name,
  reseller_logo,
  sign_agreement_link,
  revoke_reason,
  name
) => {
  var template = Handlebars.compile(tempData);
  
  var options = (locals) => {
    return {
      from: '"'+reseller_name+'" <'+environment.FROM_EMAIL+'>',
      to: toEmail,
      subject: subject +" - "+reseller_name,
      html: template(locals),
    };
  };
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
    debug: false,
  });
  transporter.sendMail(
    options({
      comp_name: reseller_name,
      comp_logo: reseller_logo,
      support_email: environment.COMP_SUPPORT_EMAIL,
      sign_up_date: sign_up_date,
      sign_agreement_link: sign_agreement_link,
      revoke_reason: revoke_reason,
      client_name: name
    }),
    function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    }
  );
};

let emailSendUnsignedAgreement = async (
  toEmail,
  subject,
  tempData,
  sign_up_date,
  reseller_name,
  reseller_logo,
  sign_agreement_link,
  name
) => {
  var template = Handlebars.compile(tempData);
  
  var options = (locals) => {
    return {
      from: '"'+reseller_name+'" <'+environment.FROM_EMAIL+'>',
      to: toEmail,
      subject: subject +" - "+reseller_name,
      html: template(locals),
    };
  };
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
    debug: false,
  });
  transporter.sendMail(
    options({
      comp_name: reseller_name,
      comp_logo: reseller_logo,
      support_email: environment.COMP_SUPPORT_EMAIL,
      sign_up_date: sign_up_date,
      sign_agreement_link: sign_agreement_link,
      client_name: name
    }),
    function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    }
  );
};

let emailSend = async (
  toEmail,
  subject,
  tempData,
  client_name,
  sign_up_date,
  token,
  reseller_name,
  reseller_logo
) => {
  var template = Handlebars.compile(tempData);
  
  var options = (locals) => {
    return {
      from: '"'+reseller_name+'" <'+environment.FROM_EMAIL+'>',
      to: toEmail,
      subject: subject +" - "+reseller_name,
      html: template(locals),
    };
  };
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
    debug: false,
  });
  transporter.sendMail(
    options({
      comp_name: reseller_name,
      comp_logo: reseller_logo,
      support_email: environment.COMP_SUPPORT_EMAIL,
      client_name: client_name,
      signup_link: environment.COMP_PORTAL_URL + token,
      sign_up_date: sign_up_date,
    }),
    function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    }
  );
};

let emailSendSubAgent = async (
  toEmail,
  subject,
  tempData,
  client_name,
  sign_up_date,
  token,
  agent_name,
  agent_comp,
  reseller_comp,
) => {
  var template = Handlebars.compile(tempData);
  
  var options = (locals) => {
    return {
      from: '"'+reseller_comp+'" <'+environment.FROM_EMAIL+'>',
      to: toEmail,
      subject: subject +" - "+reseller_comp,
      html: template(locals),
    };
  };
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
    debug: false,
  });
  transporter.sendMail(
    options({
      comp_name: reseller_comp,
      comp_logo: environment.COMP_LOGO,
      support_email: environment.COMP_SUPPORT_EMAIL,
      client_name: client_name,
      signup_link: environment.COMP_PORTAL_URL + token,
      sign_up_date: sign_up_date,
      agent_name: agent_name,
      agent_comp: agent_comp
    }),
    function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    }
  );
};

let emailSendGeneric = async (
  toEmail,
  subject,
  tempData,
  client_name,
  sign_up_date,
  token,
  reseller_name,
  reseller_logo
) => {
  var template = Handlebars.compile(tempData);
  
  var options = (locals) => {
    return {
      from: '"'+reseller_name+'" <'+environment.FROM_EMAIL+'>',
      to: toEmail,
      subject: subject +" - "+reseller_name,
      html: template(locals),
    };
  };
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
    debug: false,
  });
  transporter.sendMail(
    options({
      comp_name: reseller_name,
      comp_logo: reseller_logo,
      support_email: environment.COMP_SUPPORT_EMAIL,
      client_name: client_name,
      signup_link: token,
      sign_up_date: sign_up_date,
    }),
    function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    }
  );
};

let emailSendClientRegister = async (
  toEmail,
  subject,
  tempData,
  client_name,
  sign_up_date,
  token,
  reseller_name,
  reseller_logo
) => {
  var template = Handlebars.compile(tempData);
  
  var options = (locals) => {
    return {
      from: '"'+reseller_name+'" <'+environment.FROM_EMAIL+'>',
      to: toEmail,
      subject: subject +" - "+reseller_name,
      html: template(locals),
    };
  };
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
    debug: false,
  });
  transporter.sendMail(
    options({
      comp_name: reseller_name,
      comp_logo: reseller_logo,
      support_email: environment.COMP_SUPPORT_EMAIL,
      client_name: client_name,
      signup_link: token,
      sign_up_date: sign_up_date,
    }),
    function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    }
  );
};

let replaceContent = async (strContent, ObjContent) => {
  // ...
  let COMPANY_SIGN = `<img id = 'imgSig' src=[[IMG_AGENT_SIGN]] width = '230px' heigth='100px' alt = 'Signature'/>`;
  let VENDOR_SIGN = `<img id = 'imgVendorSig' src=[[IMG_VENDOR_SIGN]] width = '230px' heigth='100px' alt = 'VendorSignature' onerror="this.onerror=null; this.src='https://intrado.me/assets/images/signature_placeholder.png'" />`;

  let _strContent = strContent
    .replace(/\[\[AGENT_SIGNOR_TITLE\]\]/g, ObjContent.agent_title)
    .replace(/\[\[AGENT_SIGNOR_NAME\]\]/g, ObjContent.agent_name)
    .replace(/\[\[AGENT_COMPANY_NAME\]\]/g, ObjContent.agent_comp_name)
    .replace(/\[\[AGENT_EMAIL\]\]/g, ObjContent.agent_email)
    .replace(/\[\[AGENT_ADDRESS\]\]/g, ObjContent.agent_address)
    .replace(/\[\[AGENT_PHONENO\]\]/g, ObjContent.agent_phone_no)
    .replace(/\[\[AGENT_FAX\]\]/g, ObjContent.agent_fax)
    .replace(/\[\[AGENT_SIGN\]\]/g, COMPANY_SIGN)
    .replace(/\[\[CONTRACT_DATE\]\]/g, moment().format("MMMM Do YYYY"))
    .replace(/\[\[VENDOR_SIGNOR_TITLE\]\]/g, ObjContent.vendor_signor_title)
    .replace(/\[\[VENDOR_SIGNOR_NAME\]\]/g, ObjContent.vendor_signor_name)
    .replace(/\[\[VENDOR_SIGNOR_ADDRESS\]\]/g, ObjContent.vendor_signor_address)
    .replace(
      /\[\[VENDOR_SIGNOR_PHONENO\]\]/g,
      ObjContent.vendor_signor_phone_no
    )
    .replace(/\[\[VENDOR_SIGNOR_FAX\]\]/g, ObjContent.vendor_signor_fax)
    .replace(/\[\[VENDOR_SIGNOR_EMAIL\]\]/g, ObjContent.vendor_signor_email)
    .replace(/\[\[VENDOR_SIGNOR_SIGN\]\]/g, VENDOR_SIGN)

    .replace(
      /\[\[VENDOR_SIGNOR_COMPANY_NAME\]\]/g,
      ObjContent.vendor_signor_comp_name
    )
    .replace(/\[\[USER_COMPANY_NAME\]\]/g, ObjContent.agent_comp_name)
    .replace(/\[\[USER_ADDRESS\]\]/g, ObjContent.agent_address);

  return ReplaceControl(
    _strContent,
    ObjContent.posted_control,
    ObjContent.posted_control_data
  );
};

function ReplaceControl(strMessageScript, Posted_Control, Posted_Control_Data) {
  try {
    //====================CREATE BUTTON ======================================
    if (strMessageScript === "") {
      return strMessageScript;
    }
    let i = 0;
    $.map(strMessageScript.match(/\[\{(.*?)\}\]/g), function (value) {
      if (value !== "" && value !== null) {
        let ControlTag = value
          .replace(/\[/g, "")
          .replace(/\]/g, "")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "");

        let _JSON = JSON.parse(ControlTag);
        var ControlType = _JSON.type;
        if (ControlType === "textbox") {
          strMessageScript = strMessageScript.replace(
            value,
            Posted_Control[i].id === "txtfilerid"
              ? `<a target="_blank" href="https://apps.fcc.gov/cgb/form499/499detail.cfm?FilerNum=${Posted_Control_Data[i].data}">${Posted_Control_Data[i].data}</a>`
              : Posted_Control_Data[i].data
          );
        } else if (ControlType === "textarea") {
          strMessageScript = strMessageScript.replace(
            value,
            Posted_Control_Data[i].data
          );
        } else if (ControlType === "radio") {
          let radioData = _JSON.data.split(",");

          let checkValues = Posted_Control_Data[i].data.split(",");

          let checked = "";
          let flag = false;
          if (radioData[0] !== "") {
            flag = checkValues.includes(radioData[0].replace(/&#39;/g, ""));
          }

          if (flag) {
            checked = "checked";
          }

          let _Control_HTML = `<input type="radio" ${checked} />`;

          strMessageScript = strMessageScript.replace(value, _Control_HTML);
        } else if (ControlType === "checkbox") {
          let checkboxData = _JSON.data.split(",");
          let _Control_HTML = '<table style="width:100%"><tr>';
          let checkValues = Posted_Control_Data[i].data.split(",");

          for (let index = 0; index < checkboxData.length; index++) {
            const element = checkboxData[index];
            let checked = "";
            let flag = false;
            if (checkboxData[index] !== "") {
              flag = checkValues.includes(
                checkboxData[index].replace(/&#39;/g, "")
              );
            }

            if (flag) {
              checked = "checked";
            }
            let labelText =
              _JSON.showtitle.toLowerCase() === "yes"
                ? checkboxData[index].replace(/&#39;/g, "")
                : "";
            _Control_HTML += `<td><label><input type="checkbox" ${checked} name="${
              _JSON.id
            }" value="${checkboxData[index].replace(
              /&#39;/g,
              ""
            )}" />${labelText}</label></td>`;
            if (index % 2) {
              _Control_HTML += "</tr><tr>";
            }
          }
          _Control_HTML += "</table>";
          strMessageScript = strMessageScript.replace(value, _Control_HTML);
        }
      }
      i++;
    });
    return strMessageScript;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  validateAccount: validateAccount,
  validateAccountSimple:validateAccountSimple,
  sqlQuery: sqlQuery,
  verifyToken: verifyToken,
  emailSend: emailSend,
  emailSendSubAgent: emailSendSubAgent,
  emailSendRegister: emailSendRegister,
  emailSendRevoke: emailSendRevoke,
  emailSendClientRevoke: emailSendClientRevoke,
  emailSendClientRegister:emailSendClientRegister,
  emailSendUnsignedAgreement:emailSendUnsignedAgreement,
  emailSendGeneric: emailSendGeneric,
  replaceContent: replaceContent,
};
