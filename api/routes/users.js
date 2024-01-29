const express = require("express");
const router = express.Router();
const path = require("path");
const request = require("request");
var md5 = require("md5");
var CryptoJS = require("crypto-js");
const axios = require('axios');


const { check, validationResult } = require("express-validator");
// const curl = new (require("curl-request"))();
const configfile = path.join(__dirname, "../../configuration/config.js");
//const red_Client = path.join(__dirname, "./configuration/redis_config.js");
const redisClient = require( "../../configuration/redis_config");
const cnam_key = 'cnam-data.prod.io';



const sql = require(configfile);
//const redisClient = require(red_Client);
const jwt = require("jsonwebtoken");
require("dotenv").config();
const utils = require("../middleware/utils.js");

let environment = process.env;

var multer = require("multer");
//const { resolve, reject } = require("bluebird");
var upload = multer();

const toll_free = [ "1800", "1833", "1844", "1855", "1866", "1877", "1888"];

router.post(
  "/getCnam",
  // utils.validateAccount,
  // upload.none(),
  [
    check("tn").not().isEmpty().trim(),
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

        if (!(tn.slice(0, 1) === "1" && tn.length == 11)) {
          // Bad Request -- Expect length 11 if the number starts with 1 (NANPA)
          res.json({
            status: "400",
            statusDescription: "Bad request",
            error: "TN must be E.164 format with 11 digits"
          });
          return;
        }

        var data = await redisClient.json.get(
          `${tn}`,
          '.data'
        );

        // console.log('getCnam | redisData', data);

        // console.log('getCnam | dataLength', data.length);

        // console.log('getCnam | dataDataLength', data.data.length);


        var cnam_data = "UNKNOWN";

        if(data && data.data){
          cnam_data = getCnamDataLocally(data.data);
          res.json({
            status: "200",
            statusDescription: "OK",
            data: cnam_data            
          });
        }
        else{
          var third_party_cnam_data = await getThirdPartyCNAM(tn);
          if (third_party_cnam_data !== undefined) {
            console.log("third party: " + third_party_cnam_data);
            cnam_data = third_party_cnam_data;
            res.json({
              status: "200",
              statusDescription: "OK",
              data: cnam_data            
            });
          }
          else{
            res.json({
              status: "404",
              statusDescription: "Not found",            
            });
          }
        }        
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
  "/insRedisData",
  // utils.validateAccount,
  // upload.none(),
  [
    check("tn").not().isEmpty().trim(),
  ],
  async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("errors.array(): ", errors.array());
      return res.json({
        status: "404",
        statusDescription: "Not found",
        errors: {
          message: errors.message,
        },
      });
    } else {
      try {
        //console.log(redisClient);

        var tn = req.body.tn.replace(/^\D+/g, "");

        // if (!(tn.slice(0, 1) === "1" && tn.length == 11)) {
        //   // Bad Request -- Expect length 11 if the number starts with 1 (NANPA)
        //   res.json({
        //     status: "400",
        //     statusDescription: "Bad request",
        //     error: "TN must be E.164 format with 11 digits"
        //   });
        //   return;
        // }

        console.log('inserting', req.body.data);

        //await redisClient.set('hello', 'world');
        //console.log('redisclient ', redisClient);
        // await redisClient.HSET('hello1', 'world1', 'pakistan');
        
        // console.log('insRedisData | abc', await redisClient.get('abc'));

        // console.log('insRedisData | hget', await redisClient.HGET('hello1','world1'));

        // await redisClient.hSet(
        //   'hello',
        //   'world',
        //   'pakistan'
        // );

        await redisClient.json.set(
          `${tn}`,
          '.',
          {
            data:req.body.data
          }
        );

        var temp = await redisClient.json.get(
          `${tn}`,
          '.data'
        );

        console.log('fetching', temp);


        res.json({
          status: "200",
          statusDescription: "OK",
          data: temp      
        });

        
      } catch (e) {
        console.log('catch',e);
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
    console.log('function',error);
    res.json({
      status: '404',
      statusDescription: 'Not found',
      errors: {
        message: error,
      },
    });
  }
);

router.post(
  "/getCnamWireless",
  // utils.validateAccount,
  // upload.none(),
  [
    check("tn").not().isEmpty().trim(),
  ],
  async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("errors.array(): ", errors.array());
      return res.json({
        status: "404",
        statusDescription: "Not found",
        errors: {
          message: errors.array(),
        },
      });
    } else {
      try {

        var tn = req.body.tn.replace(/^\D+/g, "");

        if (!(tn.slice(0, 1) === "1" && tn.length == 11)) {
          // Bad Request -- Expect length 11 if the number starts with 1 (NANPA)
          res.json({
            status: "400",
            statusDescription: "Bad request",
            error: "TN must be E.164 format with 11 digits"
          });
          return;
        }

        var data = await redisClient.json.get(
          `${tn}`,
          '.data'
        );

        var cnam_data = "UNKNOWN";
        if(data && data.data){
          cnam_data = getCnamDataLocally(data.data);
          if(cnam_data === 'UNKNOWN'){
            if(checkIFWireless(data.data)){
              cnam_data = 'Wireless Caller';
              res.json({
                status: "200",
                statusDescription: "OK",
                data: cnam_data            
              });
            }
            else{
              res.json({
                status: "404",
                statusDescription: "Not found",            
              });
            }            
          }
          else{
            res.json({
              status: "200",
              statusDescription: "OK",
              data: cnam_data            
            });
          }
        }
        else{
          res.json({
            status: "404",
            statusDescription: "Not found",            
          });
        }
        
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
  "/getCnamRateCenter",
  // utils.validateAccount,
  // upload.none(),
  [
    check("tn").not().isEmpty().trim(),
  ],
  async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("errors.array(): ", errors.array());
      return res.json({
        status: "404",
        statusDescription: "Not found",
        errors: {
          message: errors.array(),
        },
      });
    } else {
      try {
        var tn = req.body.tn.replace(/^\D+/g, "");

        if (!(tn.slice(0, 1) === "1" && tn.length == 11)) {
          // Bad Request -- Expect length 11 if the number starts with 1 (NANPA)
          res.json({
            status: "400",
            statusDescription: "Bad request",
            error: "TN must be E.164 format with 11 digits"
          });
          return;
        }
        var tempTn = tn.slice(0,7);

        var data = await redisClient.json.get(
          `${tn}`,
          '.data'
        );

        var cnam_data = "UNKNOWN";
        if(data && data.data){
          cnam_data = getCnamDataLocally(data.data);
          if(cnam_data === 'UNKNOWN'){
            data = await redisClient.json.get(
              `${tempTn}`,
              '.data'
            );
            if(data && data.data){
              if(checkIFRateCenter(data.data)){
                cnam_data = data.data.region.S;
                res.json({
                  status: "200",
                  statusDescription: "OK",
                  data: cnam_data            
                });
              }
              else{
                res.json({
                  status: "404",
                  statusDescription: "Not found",            
                });
              }
            }
            else{
              res.json({
                status: "404",
                statusDescription: "Not found",            
              });
            }
            
            
          }
          else{
            res.json({
              status: "200",
              statusDescription: "OK",
              data: cnam_data            
            });
          }
        }
        else{
          data = await redisClient.json.get(
            `${tempTn}`,
            '.data'
          );
          if(data && data.data){
            if(checkIFRateCenter(data.data)){
              cnam_data = data.data.region.S;
              res.json({
                status: "200",
                statusDescription: "OK",
                data: cnam_data            
              });
            }
            else{
              res.json({
                status: "404",
                statusDescription: "Not found",            
              });
            }
          }
          else{
            res.json({
              status: "404",
              statusDescription: "Not found",            
            });
          }
        }

        
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
  "/getCnamWirelessRateCenter",
  // utils.validateAccount,
  // upload.none(),
  [
    check("tn").not().isEmpty().trim(),
  ],
  async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("errors.array(): ", errors.array());
      return res.json({
        status: "404",
        statusDescription: "Not found",
        errors: {
          message: errors.array(),
        },
      });
    } else {
      try {
        var tn = req.body.tn.replace(/^\D+/g, "");

        if (!(tn.slice(0, 1) === "1" && tn.length == 11)) {
          // Bad Request -- Expect length 11 if the number starts with 1 (NANPA)
          res.json({
            status: "400",
            statusDescription: "Bad request",
            error: "TN must be E.164 format with 11 digits"
          });
          return;
        }

        var tempTn = tn.slice(0,7);

        var data = await redisClient.json.get(
          `${tn}`,
          '.data'
        );

        var cnam_data = "UNKNOWN";
        if(data && data.data){
          cnam_data = getCnamDataLocally(data.data);
          if(cnam_data === 'UNKNOWN'){
            if(checkIFWireless(data.data)){
              cnam_data = 'Wireless Caller';
              res.json({
                status: "200",
                statusDescription: "OK",
                data: cnam_data            
              });
            }
            else{
              data = await redisClient.json.get(
                `${tempTn}`,
                '.data'
              );
              if(data && data.data){
                if(checkIFRateCenter(data.data)){
                  cnam_data = data.data.region.S;
                  res.json({
                    status: "200",
                    statusDescription: "OK",
                    data: cnam_data            
                  });
                }
                else{
                  res.json({
                    status: "404",
                    statusDescription: "Not found",            
                  });
                }
              }
              else{
                res.json({
                  status: "404",
                  statusDescription: "Not found",            
                });
              }
            }            
          }
          else{
            res.json({
              status: "200",
              statusDescription: "OK",
              data: cnam_data            
            });
          }
        }
        else{
          data = await redisClient.json.get(
            `${tempTn}`,
            '.data'
          );
          if(data && data.data){
            if(checkIFRateCenter(data.data)){
              cnam_data = data.data.region.S;
              res.json({
                status: "200",
                statusDescription: "OK",
                data: cnam_data            
              });
            }
            else{
              res.json({
                status: "404",
                statusDescription: "Not found",            
              });
            }
          }
          else{
            res.json({
              status: "404",
              statusDescription: "Not found",            
            });
          }
        }

        
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
  "/getCnamWirelessRateCenterThirdParty",
  // utils.validateAccount,
  // upload.none(),
  [
    check("tn").not().isEmpty().trim(),
  ],
  async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("errors.array(): ", errors.array());
      return res.json({
        status: "404",
        statusDescription: "Not found",
        errors: {
          message: errors.array(),
        },
      });
    } else {
      try {
        var tn = req.body.tn.replace(/^\D+/g, "");

        if (!(tn.slice(0, 1) === "1" && tn.length == 11)) {
          // Bad Request -- Expect length 11 if the number starts with 1 (NANPA)
          res.json({
            status: "400",
            statusDescription: "Bad request",
            error: "TN must be E.164 format with 11 digits"
          });
          return;
        }

        var tempTn = tn.slice(0,7);

        var data = await redisClient.json.get(
          `${tn}`,
          '.data'
        );

        var cnam_data = "UNKNOWN";
        if(data && data.data){
          cnam_data = getCnamDataLocally(data.data);
          if(cnam_data === 'UNKNOWN'){
            var third_party_cnam_data = await getThirdPartyCNAM(tn);
            if (third_party_cnam_data !== undefined) {
              console.log("third party: " + third_party_cnam_data);
              cnam_data = third_party_cnam_data;
              res.json({
                status: "200",
                statusDescription: "OK",
                data: cnam_data,
              });
            } else {
              if(checkIFWireless(data.data)){
                cnam_data = 'Wireless Caller';
                res.json({
                  status: "200",
                  statusDescription: "OK",
                  data: cnam_data            
                });
              }
              else{
                data = await redisClient.json.get(
                  `${tempTn}`,
                  '.data'
                );
                if(data && data.data){
                  if(checkIFRateCenter(data.data)){
                    cnam_data = data.data.region.S;
                    res.json({
                      status: "200",
                      statusDescription: "OK",
                      data: cnam_data            
                    });
                  }
                  else{
                    res.json({
                      status: "404",
                      statusDescription: "Not found",            
                    });
                  }
                }
                else{
                  res.json({
                    status: "404",
                    statusDescription: "Not found",            
                  });
                }
              }
            }


                        
          }
          else{
            res.json({
              status: "200",
              statusDescription: "OK",
              data: cnam_data            
            });
          }
        }
        else{
          var third_party_cnam_data = await getThirdPartyCNAM(tn);
            if (third_party_cnam_data !== undefined) {
              console.log("third party: " + third_party_cnam_data);
              cnam_data = third_party_cnam_data;
              res.json({
                status: "200",
                statusDescription: "OK",
                data: cnam_data,
              });
            } else {
              data = await redisClient.json.get(
                `${tempTn}`,
                '.data'
              );
              if(data && data.data){
                if(checkIFRateCenter(data.data)){
                  cnam_data = data.data.region.S;
                  res.json({
                    status: "200",
                    statusDescription: "OK",
                    data: cnam_data            
                  });
                }
                else{
                  res.json({
                    status: "404",
                    statusDescription: "Not found",            
                  });
                }
              }
              else{
                res.json({
                  status: "404",
                  statusDescription: "Not found",            
                });
              }
            }
        }


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
  "/getCnamWirelessRateCenterSpamLikely",
  // utils.validateAccount,
  // upload.none(),
  [
    check("tn").not().isEmpty().trim(),
  ],
  async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      //console.log("errors.array(): ", errors.array());
      return res.json({
        status: "404",
        statusDescription: "Not found",
        errors: {
          message: errors.array(),
        },
      });
    } else {
      try {
        var tn = req.body.tn.replace(/^\D+/g, "");

        if (!(tn.slice(0, 1) === "1" && tn.length == 11)) {
          // Bad Request -- Expect length 11 if the number starts with 1 (NANPA)
          res.json({
            status: "400",
            statusDescription: "Bad request",
            error: "TN must be E.164 format with 11 digits"
          });
          return;
        }

        var tempTn = tn.slice(0,7);

        var cnam_data = "UNKNOWN";

        var flow_spam_data = await getSpamCNAM(tn);
        if(flow_spam_data !== undefined){
          cnam_data = flow_spam_data;
          res.json({
            status: "200",
            statusDescription: "OK",
            data: cnam_data            
          });
        }
        else{
          var data = await redisClient.json.get(
            `${tn}`,
            '.data'
          );

          if(data && data.data){
            cnam_data = getCnamDataLocally(data.data);
            if(cnam_data === 'UNKNOWN'){
              if(checkIFWireless(data.data)){
                cnam_data = 'Wireless Caller';
                res.json({
                  status: "200",
                  statusDescription: "OK",
                  data: cnam_data            
                });
              }
              else{
                data = await redisClient.json.get(
                  `${tempTn}`,
                  '.data'
                );
                if(data && data.data){
                  if(checkIFRateCenter(data.data)){
                    cnam_data = data.data.region.S;
                    res.json({
                      status: "200",
                      statusDescription: "OK",
                      data: cnam_data            
                    });
                  }
                  else{
                    res.json({
                      status: "404",
                      statusDescription: "Not found",            
                    });
                  }
                }
                else{
                  res.json({
                    status: "404",
                    statusDescription: "Not found",            
                  });
                }
              }
  
  
                          
            }
            else{
              res.json({
                status: "200",
                statusDescription: "OK",
                data: cnam_data            
              });
            }
          }
          else{
            data = await redisClient.json.get(
              `${tempTn}`,
              '.data'
            );
            if(data && data.data){
              if(checkIFRateCenter(data.data)){
                cnam_data = data.data.region.S;
                res.json({
                  status: "200",
                  statusDescription: "OK",
                  data: cnam_data            
                });
              }
              else{
                res.json({
                  status: "404",
                  statusDescription: "Not found",            
                });
              }
            }
            else{
              res.json({
                status: "404",
                statusDescription: "Not found",            
              });
            }
          }
        }
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

function checkIFWireless(data) {
  //console.log('checkIFWireless',data);
  if (
    "wireless" in data &&
    (data.wireless.S !== "0" || WIRELESS_SPIDS.includes(data.spid.S))
  ) {
    return true;
  }
  return false;
}

function checkIFRateCenter(data) {
  if ("region" in data) {
    return true;
  }
  return false;
}

function getCnamDataLocally(data) {
  var cnam_data = "UNKNOWN";
  if ("carrier" in data && "text" in data.carrier.M) {
    // CNAM carrier record
    cnam_data = data.carrier.M.text;
  } else if ("consumer" in data) {
    // Consumer record
    if ("firstname" in data.consumer.M && "lastname" in data.consumer.M) {
      cnam_data = data.consumer.M.firstname.S + " " + data.consumer.M.lastname.S;
    }
  } else if ("business" in data) {
    // Business record
    if ("company" in data.business.M) {
      cnam_data = data.business.M.company.S;
    }
  }
  return cnam_data;
}

async function getThirdPartyCNAM(tn){
  let cnam;

  if(isTollFree(tn)) {
      console.log("querying toll free API");
      cnam = await getTollFreeCNAM(tn);
  }
  else{
      console.log("querying BW API");
      cnam = await getBandwidthCNAM(tn);
  }
  if(cnam !== undefined){
    
    const thirdPartyJson = {
      "consumer": {
        "M": {
          "firstname": {
            "S": cnam
          },
          "lastname": {
            "S": ''
          }
        }
      }
    };
    await redisClient.json.set(
      `${tn}`,
      '.',
      {
        data:thirdPartyJson
      }
    );
  }

  return cnam;
}

function isTollFree(tn){
  return toll_free.includes(tn.slice(0,4));
}

async function getTollFreeCNAM(tn){
  let cnam;

  var auth_data = JSON.stringify({
      "username": process.env.TOLLFREE_API_USERNAME,
      "password": process.env.TOLLFREE_API_PASS
  });

  var auth_config = {
      method: 'POST',
      url: process.env.TOLLFREE_API_URL + '/authorize/verifyPassword',
      data: auth_data,
      headers: {
          'Content-Type': 'application/json'
      }
  };

  let auth_response = await axios(auth_config).catch((error) => console.log(error));

  if (auth_response && auth_response.status == 200 && auth_response.data && auth_response.data.accessToken) {
      console.log("TF auth response: " + auth_response.data);

      var data = JSON.stringify({
          "tollFreeNumbers": [
              //format number as 10 digits "8552523386"
              tn.substring(1)
          ]
      });

      var config = {
          method: 'POST',
          url: process.env.TOLLFREE_API_URL + '/tollFrees/cnamQuery',
          data: data,
          headers: {
              "client-id": process.env.TOLLFREE_API_CLIENT_ID,
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + auth_response.data.accessToken
          }
      };

      //console.log(config);


      let response = await axios(config).catch((error) => console.log(error));

      //console.log(response);

      if (response && response.status == 200 && response.data &&
              response.data.tollFreeCnams && response.data.tollFreeCnams.length && response.data.tollFreeCnams[0].name) {
          console.log("TF response: " + response.data);
          cnam = response.data.tollFreeCnams[0].name;
      }
  }

  return cnam;
}

async function getSpamCNAM(tn){
  let spam_data = await getSpamScore(tn);
  let cnam;

  

  if(spam_data && parseInt(spam_data.spam_score_match) === 1 && parseInt(spam_data.spam_score) > 79){
      cnam = 'SPAM LIKELY';
  }
  console.log('cnam',spam_data);

  return cnam;
}

async function getSpamScore(tn){
  let spam_data;

  let args = {
          "username" : process.env.TRUESPAM_USERNAME,
          "password" : process.env.TRUESPAM_PASSWORD,
          "calling_number" : tn,
          "resp_type" : "extended",
          "resp_format" : "json",
          "call_party" : "terminating"
  };

  let params = Object.keys(args).map(key => key + '=' + args[key]).join('&');

  var config = {
      method: 'GET',
      url: process.env.TRUESPAM_URL + '?' + params
  };

  //Example response:
  // {
  //     "called_number": "",
  //     "proposed_calling_number": "",
  //     "extended_name": "",
  //     "queries_per_minute_remaining": 1195,
  //     "queries_per_day_remaining": 975424,
  //     "spam_score": 0,
  //     "calling_number": "15036638100",
  //     "spam_score_match": 1,
  //     "err": "0",
  //     "true_clid": "true",
  //     "cnam_match": 0,
  //     "error_msg": "",
  //     "name": ""
  // }
  let response = await axios(config).catch((error) => console.log(error));
  //console.log("TrueCNAM response: ", response);

  if (response && response.status == 200 && response.data.err === "0") {
      //console.log("TrueCNAM response: ", response.data);
      spam_data = response.data;
  }
  else{
      console.log("TrueCNAM error: ", response);
  }

  return spam_data;
}

async function getBandwidthCNAM(tn){
  let cnam;

  var config = {
      method: 'GET',
      url: process.env.BANDWIDTH_CNAM_URL +
          "?companyId=" + process.env.BANDWIDTH_CNAM_COMPANY_ID +
          "&password=" + encodeURIComponent(process.env.BANDWIDTH_CNAM_PASS) +
          '&number=' + tn
  };

  //console.log(config);

  let response = await axios(config).catch((error) => console.log(error));

  //console.log(response);


  if (response && response.status == 200 && response.data.length) {
      console.log("Bw response: " + response.data);
      cnam = response.data;
  }

  return cnam;
}

const WIRELESS_SPIDS = [
  "0051",
  "013B",
  "017E",
  "031D",
  "036F",
  "0822",
  "0972",
  "098E",
  "1085",
  "122D",
  "134F",
  "139F",
  "139H",
  "146E",
  "1484",
  "148G",
  "158J",
  "169D",
  "1772",
  "187B",
  "2017",
  "2032",
  "208J",
  "2182",
  "235C",
  "2526",
  "2601",
  "2967",
  "308F",
  "3106",
  "3107",
  "3108",
  "3129",
  "323J",
  "334C",
  "335G",
  "340D",
  "346D",
  "3533",
  "356H",
  "364C",
  "365J",
  "3685",
  "374F",
  "376F",
  "3804",
  "387C",
  "387E",
  "3922",
  "3945",
  "4010",
  "4011",
  "401D",
  "404D",
  "4146",
  "4196",
  "4234",
  "425J",
  "4260",
  "429F",
  "434F",
  "441F",
  "441G",
  "443B",
  "453G",
  "4609",
  "4635",
  "467B",
  "468B",
  "4812",
  "4823",
  "489J",
  "4903",
  "490J",
  "4955",
  "4969",
  "499B",
  "5014",
  "5221",
  "5271",
  "5338",
  "543F",
  "551G",
  "5714",
  "5715",
  "5736",
  "588F",
  "5932",
  "6006",
  "6010",
  "6021",
  "6214",
  "6232",
  "624H",
  "6260",
  "6292",
  "6354",
  "6395",
  "6506",
  "6548",
  "6581",
  "6628",
  "6674",
  "6692",
  "6718",
  "6733",
  "6739",
  "677B",
  "6783",
  "6822",
  "682H",
  "6872",
  "6874",
  "6882",
  "6921",
  "6922",
  "6935",
  "6940",
  "6941",
  "6967",
  "698E",
  "765B",
  "775D",
  "815E",
  "825D",
  "843H",
  "8645",
  "893H",
  "901G",
  "9304",
  "9475",
  "955F",
  "9572",
  "9607",
  "973H",
  "9814"
];

module.exports = router;
