const express = require("express");
const { spawn } = require("child_process");
const router = express.Router();
//const str2obj = require("string-to-object");
const path = require("path");
const nodeRes = require("node-res");
const fs = require("fs");
const request = require("request");
var md5 = require("md5");
var CryptoJS = require("crypto-js");
const { check, validationResult } = require("express-validator");
const configfile = path.join(__dirname, "../../configuration/config.js");
const sql = require(configfile);
const jwt = require("jsonwebtoken");
require("dotenv").config();
//const { uuid } = require("uuidv4");
const utils = require("../middleware/utils.js");
let environment = process.env;
var multer = require("multer");
var upload = multer();
const uuid = require('uuid');
const redisClient = require( "../../configuration/redis_config");



router.post(
  "/apikey/create",
  // utils.validateAccount,
  // upload.none(),
  [
    check("account_id").not().isEmpty().trim(),
    check("description").not().isEmpty().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("errors.array(): ", errors.array());
      return res.json({
        status: "404",
        statusDescription: "Not found",
        errors: errors.array(),
      });
    } else {
      try {
        // Check that the account_id is acceptable
        const account_id = req.body.account_id;
        const description = req.body.description;

        if (!/[a-z0-9_]{5,16}/.test(account_id.toLowerCase())) {
          console.log("Failed to add: " + account_id);
          return res.send(sendResponse(400, {
            message: 'Invalid account_id. It must match "[a-z0-9_]{5,16}"',
          })); 
        }
        if (isAdmin(account_id)) {
          return res.send(
            sendResponse(400, { message: "Invalid account_id." })
          );
        }

        let api_key = uuid.v4();

        let id = account_id.toLowerCase() + '#' + api_key;

        let item = {
            id: id,
            enabled: "1",
            description: description || '',
            created_date: new Date().toISOString()
        };

        var data = await redisClient.json.get(
          `${account_id.toLowerCase().trim()}`,
          '.data'
        );

        var apiKeysList = [];

        if(data && data.data && data.data.length > 0){
          apiKeysList = data.data;
        }
        apiKeysList.push(item);
        await redisClient.json.set(
          `${account_id.toLowerCase().trim()}`,
          '.',
          {
            data:apiKeysList
          }
        );
        return res.send(
          sendResponse(200, {
            id: account_id.toLowerCase(),
            key: api_key,
            enabled: item.enabled,
            description: item.description || "",
            created_date: item.created_date || "",
          })
        );



      } catch (e) {
        console.log(e);
        return res.send(
          sendResponse(500, { message: "Failed to create api key" })
        );
      }
    }
  },
  function (error) {
    console.log('error',error);
    res.json({
      status: 404,
      error: {
        message: error.code,
      },
    });
  }
);

router.post(
  "/apikey/all",
  // utils.validateAccount,
  // upload.none(),
  [
    check("account_id").not().isEmpty().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("errors.array(): ", errors.array());
      return res.json({
        status: "404",
        statusDescription: "Not found",
        errors: errors.array(),
      });
    } else {
      try {
        // Check that the account_id is acceptable
        const account_id = req.body.account_id;

        if (isAdmin(account_id)) {
          return res.send(
            sendResponse(400, { message: "Invalid account_id." })
          );
        }

        var data = await redisClient.json.get(
          `${account_id.toLowerCase().trim()}`,
          '.data'
        );

        

        if (data && data.data && data.data.length > 0) {
          let response = data.data.map((item) => {
            let key = item.id.split("#");

            return {
              id: key[0],
              key: key[1],
              enabled: item.enabled,
              description: item.description || "",
              created_date: item.created_date || "",
            };
          });
          //console.log('data',response);

          return res.send(sendResponse(200, response.reverse()));
        }
        return res.send(sendResponse(404, { message: "no keys found" }));
      } catch (e) {
        console.log(e);
        return res.send(
          sendResponse(500, { message: "Failed to get api keys" })
        );
      }
    }
  },
  function (error) {
    console.log('error',error);
    res.json({
      status: 404,
      error: {
        message: error.code,
      },
    });
  }
);

router.post(
  "/apikey/delete",
  // utils.validateAccount,
  // upload.none(),
  [
    check("account_id").not().isEmpty().trim(),
    check("api_key").not().isEmpty().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("errors.array(): ", errors.array());
      return res.json({
        status: "404",
        statusDescription: "Not found",
        errors: errors.array(),
      });
    } else {
      try {
        // Check that the account_id is acceptable
        const account_id = req.body.account_id;
        const api_key = req.body.api_key;

        if (isAdmin(account_id)) {
          return res.send(
            sendResponse(400, { message: "Invalid account_id." })
          );
        }

        if(account_id && api_key){
          var data = await redisClient.json.get(
            `${account_id.toLowerCase().trim()}`,
            '.data'
          );

          if (data && data.data && data.data.length > 0) {
            let response = data.data.filter((item) => {
              return item.id !== `${account_id}#${api_key}`  ;
            });

            let keyData = data.data.filter((item) => {
              return item.id === `${account_id}#${api_key}`  ;
            });

            console.log('data',response);

            if(keyData && keyData.length > 0){
              if(response){
                await redisClient.json.set(
                  `${account_id.toLowerCase().trim()}`,
                  '.',
                  {
                    data:response
                  }
                );
                return res.send(sendResponse(200, {message: 'API key deleted'}));
  
              }
            }
            
          }
          return res.send(sendResponse(404, { message: "no account_id/api_key found" }));
        }
        return res.send(sendResponse(400, { message: 'Missing account_id/api_key query parameters' }));

      } catch (e) {
        console.log(e);
        return res.send(
          sendResponse(500, { message: "Failed to get api keys" })
        );
      }
    }
  },
  function (error) {
    console.log('error',error);
    res.json({
      status: 404,
      error: {
        message: error.code,
      },
    });
  }
);

router.post(
  "/cnam/update",
  // utils.validateAccount,
  // upload.none(),
  [
    check("tn").not().isEmpty().trim(),
    check("cnam_text").not().isEmpty().trim(),
    check("id").not().isEmpty().trim(),
    check("status").not().isEmpty().trim(),
  ],
  async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("errors.array(): ", errors.array());
      return res.json({
        status: "404",
        statusDescription: "Not found",
        errors: errors.array(),
      });
    } else {
      try {

        var tn = req.body.tn.replace(/^\D+/g, "");
        var cnam_text = req.body.cnam_text;
        var id = req.body.id;
        var status = req.body.status;

        if (!(tn.slice(0, 1) === "1" && tn.length == 11)) {
          // Bad Request -- Expect length 11 if the number starts with 1 (NANPA)
          res.json({
            status: "400",
            statusDescription: "Bad request",
            error: "TN must be E.164 format with 11 digits"
          });
          return;
        }

        if (!cnam_text) {
          return res.send(sendResponse(400, { error: "cnam_text is required" }));
        }

        var data = await redisClient.json.get(
          `${tn}`,
          '.data'
        );

        if(data && data.data){

          await updateItem(tn, cnam_text, id,data.data,status);

        }
        else{
          await updateItem(tn, cnam_text, id,undefined,status);
        }

        

        res.send(sendResponse(200, { message: 'Request has been submitted successfully' }));
        
      } catch (e) {
        res.json({
          status: "404",
          statusDescription: "Not found",
          errors: {
            message: e,
          },
        });
      }
    }
  },
  function (error) {
    res.json({
      status: '404',
      statusDescription: 'Not found',
      errors: {
        message: error.message,
      },
    });
  }
);

router.post(
  "/cnam/delete",
  // utils.validateAccount,
  // upload.none(),
  [
    check("tn").not().isEmpty().trim(),
    check("id").not().isEmpty().trim(),
  ],
  async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("errors.array(): ", errors.array());
      return res.json({
        status: "404",
        statusDescription: "Not found",
        errors: errors.array(),
      });
    } else {
      try {

        var tn = req.body.tn.replace(/^\D+/g, "");
        var id = req.body.id;

        if (!(tn.slice(0, 1) === "1" && tn.length == 11)) {
          // Bad Request -- Expect length 11 if the number starts with 1 (NANPA)
          res.json({
            status: "400",
            statusDescription: "Bad request",
            error: "TN must be E.164 format with 11 digits"
          });
          return;
        }

        if (id && id !== "admin") {
          return res.send(sendResponse(400, { message: 'Only Admin can delete cnam' }));
        }

        await redisClient.del(
          `${tn}`
        );

        res.send(sendResponse(200, 'cnam deleted successfully'));
        
      } catch (e) {
        res.json({
          status: "404",
          statusDescription: "Not found",
          errors: {
            message: e,
          },
        });
      }
    }
  },
  function (error) {
    res.json({
      status: '404',
      statusDescription: 'Not found',
      errors: {
        message: error.message,
      },
    });
  }
);

async function updateItem(tn, payload, id,data,status){
  let expression_values = data !== undefined ? {
    ...data,
    "consumer_updated": {
      "M": {
        "firstname": {
          "S": payload
        },
        "lastname": {
          "S": ''
        }
      }
    },
    "status": (status === "pending" || status === "inprocess" || status === "approve" || status === "completed" || status === "reject") ? status : "pending"
  } : {
    "consumer": {
      "M": {
        "firstname": {
          "S": ""
        },
        "lastname": {
          "S": ''
        }
      }
    },
    "consumer_updated": {
      "M": {
        "firstname": {
          "S": payload
        },
        "lastname": {
          "S": ''
        }
      }
    },
    "status": (status === "pending" || status === "inprocess" || status === "approve" || status === "completed" || status === "reject") ? status : "pending"
  };

  if(id && id !== 'admin'){
      expression_values.updated_by = id;
      expression_values.updated_time = new Date().toISOString();
  }

  try {
    await redisClient.json.set(
      `${tn}`,
      '.',
      {
        data:expression_values
      }
    );
  }
  catch (err) {
      console.log(err);
      //console.log("Item not found, creating new tn");
      //await createItem(tn, payload, id);
  }
}

const sendResponse = (statusCode, body) => {
  return {
      status: statusCode,
      data: body,
      // headers: {
      //     'Content-Type': 'application/json',
      //     'Access-Control-Allow-Origin': '*',
      //     'Access-Control-Allow-Credentials': true
      // }
  };
};

function isAdmin(account_id){
  return account_id.toLowerCase() === 'admin';
}

module.exports = router;
