const express = require("express");
const { spawn } = require("child_process");
const router = express.Router();
var request = require("request");
const { check, validationResult } = require("express-validator");
require("dotenv").config();
const utils = require("../middleware/utils.js");
let environment = process.env;
var multer = require("multer");
var upload = multer();


router.post(
  "/add_client_agreement",
  utils.validateAccount,
  upload.none(),
  //upload.single('rate_deck_file'),
  [
    check("accountno").not().isEmpty().trim(),
    check("agreement_title").not().isEmpty().trim(),
    check("agreement_instruction").not().isEmpty().trim(),
    check("agreement_content").not().isEmpty().trim(),
  ],
  async (req, res) => {
    console.log("REQ: ",req.body);
    const errors = validationResult(req.body);
    
    if (!errors.isEmpty()) {
      return res.json({ status: 404, errors: errors.array() });
    } else {
      try {
        //console.log(req.body);
        await utils.sqlQuery("INSERT INTO client_agreements set ?", {
          agreement_title: req.body.agreement_title,
          agreement_instruction: req.body.agreement_instruction,
          isactive: req.body.isactive,
          ismandatory: req.body.ismandatory,           
          agreement_content: req.body.agreement_content,            
          reseller_accountno: req.body.reseller_accountno,
          agreement_accountno: req.body.agreement_accountno,
        });

        res.json({ status: 200, message: "success" });
      } catch (e) {
        console.log(e.message);
        res.json({
          status: 405,
          errors: {
            message: e.message,
          },
        });
      }
    }
  },
  function (error) {
    console.log(error.message);
    res.json({
      status: 406,
      errors: {
        message: error.code,
      },
    });
  }
);

router.post(
  "/edit_client_agreement",
  utils.validateAccount,
  upload.none(),
  //upload.single('rate_deck_file'),
  [
    check("accountno").not().isEmpty().trim(),
    check("agreement_title").not().isEmpty().trim(),
    check("agreement_instruction").not().isEmpty().trim(),
    check("agreement_content").not().isEmpty().trim(),
    check("agreement_accountno").not().isEmpty().trim(),
  ],
  async (req, res) => {
    console.log("REQ: ",req.body);
    const errors = validationResult(req.body);
    
    if (!errors.isEmpty()) {
      return res.json({ status: 404, errors: errors.array() });
    } else {
      try {
        //console.log(req.body);
        await utils.sqlQuery(
          "UPDATE client_agreements SET ? WHERE agreement_accountno=" +
            req.body.agreement_accountno,
          [
            {
              agreement_title: req.body.agreement_title,
              agreement_instruction: req.body.agreement_instruction,
              isactive: req.body.isactive,
              ismandatory: req.body.ismandatory,           
              agreement_content: req.body.agreement_content
            },
          ]
        );

        res.json({ status: 200, message: "success" });
      } catch (e) {
        console.log(e.message);
        res.json({
          status: 405,
          errors: {
            message: e.message,
          },
        });
      }
    }
  },
  function (error) {
    console.log(error.message);
    res.json({
      status: 406,
      errors: {
        message: error.code,
      },
    });
  }
);

router.post(
  "/delete_client_agreement",
  utils.validateAccount,
  upload.none(),
  //upload.single('rate_deck_file'),
  [
    check("accountno").not().isEmpty().trim(),
    check("agreement_accountno").not().isEmpty().trim(),
  ],
  async (req, res) => {
    console.log("REQ: ",req.body);
    const errors = validationResult(req.body);
    
    if (!errors.isEmpty()) {
      return res.json({ status: 404, errors: errors.array() });
    } else {
      try {
        //console.log(req.body);
        const settingsCheck = await utils.sqlQuery(
          "SELECT * FROM client_agreements WHERE agreement_accountno = ?",
          [req.body.agreement_accountno]
        );

        if (settingsCheck.length > 0) {
          await utils.sqlQuery(
            "UPDATE client_agreements SET ? WHERE agreement_accountno=" +
              req.body.agreement_accountno,
            [
              {
                archived: 1,
                modified_date: new Date(),
              },
            ]
          );

          res.json({ status: 200, message: "success" });
        } else {
          res.json({ status: 404, message: "not_found" });
        }
      } catch (e) {
        console.log(e.message);
        res.json({
          status: 405,
          errors: {
            message: e.message,
          },
        });
      }
    }
  },
  function (error) {
    console.log(error.message);
    res.json({
      status: 406,
      errors: {
        message: error.code,
      },
    });
  }
);

router.post(
  "/update_service_agreement",
  utils.validateAccount,
  upload.none(),
  //upload.single('rate_deck_file'),
  [
    check("accountno").not().isEmpty().trim(),
    check("agreement_accountno").not().isEmpty().trim(),
    check("service_id").not().isEmpty().trim(),
  ],
  async (req, res) => {
    
    const errors = validationResult(req.body);
    
    if (!errors.isEmpty()) {
      return res.json({ status: 404, errors: errors.array() });
    } else {
      try {
        //console.log(req.body);
        const settingsCheck = await utils.sqlQuery(
          "SELECT * FROM client_service_agreements WHERE service_id = ?",
          [req.body.service_id]
        );

        if (settingsCheck.length > 0) {
          await utils.sqlQuery(
            "UPDATE client_service_agreements SET ? WHERE service_id=" +
              req.body.service_id,
            [
              {
                agreement_accountno: req.body.agreement_accountno,
                date_updated: new Date(),
              },
            ]
          );

          res.json({ status: 200, message: "success" });
        } else {
          await utils.sqlQuery("INSERT INTO client_service_agreements set ?", {
            service_id: req.body.service_id,
            agreement_accountno: req.body.agreement_accountno,
            date_added: new Date(),
          });
          res.json({ status: 200, message: "success" });
        }
      } catch (e) {
        console.log(e.message);
        res.json({
          status: 405,
          message: e.message,
          errors: {
            message: e.message,
          },
        });
      }
    }
  },
  function (error) {
    
    res.json({
      status: 406,
      message: error.message,
      errors: {
        message: error.code,
      },
    });
  }
);

router.post(
  "/update_service_agreement_bulk",
  utils.validateAccount,
  upload.none(),
  //upload.single('rate_deck_file'),
  [
    check("accountno").not().isEmpty().trim(),
    check("agreement_accountno").not().isEmpty().trim(),
    check("service_id").not().isEmpty().trim(),
  ],
  async (req, res) => {
    
    const errors = validationResult(req.body);
    
    if (!errors.isEmpty()) {
      return res.json({ status: 404, errors: errors.array() });
    } else {
      try {
        //console.log(req.body);

        let service_array = JSON.parse(req.body.service_id);
        for(var i = 0; i < service_array.length; i++){
          const assignedCheck = await utils.sqlQuery(
            "SELECT * FROM client_service_agreements WHERE service_id = ?",
            [service_array[i]]
          );
          if (assignedCheck.length > 0) {
            await utils.sqlQuery(
              "UPDATE client_service_agreements SET ? WHERE service_id=" +
              service_array[i],
              [
                {
                  agreement_accountno: req.body.agreement_accountno,
                },
              ]
            );
          } else {
            await utils.sqlQuery("INSERT INTO client_service_agreements set ?", {
              service_id: service_array[i],
              agreement_accountno: req.body.agreement_accountno,
              date_added: new Date(),
            });
          }
        }
        res.json({ status: 200, message: "success" });
      } catch (e) {
        console.log(e.message);
        res.json({
          status: 405,
          message: e.message,
          errors: {
            message: e.message,
          },
        });
      }
    }
  },
  function (error) {
    
    res.json({
      status: 406,
      message: error.message,
      errors: {
        message: error.code,
      },
    });
  }
);

router.post(
  "/get_agent_signed_agreements",
  utils.validateAccount,
  upload.none(),
  //upload.single('rate_deck_file'),
  [
    check("accountno").not().isEmpty().trim(),
    check("agent_accountno").not().isEmpty().trim(),
  ],
  async (req, res) => {
    
    const errors = validationResult(req.body);
    
    if (!errors.isEmpty()) {
      return res.json({ status: 404, errors: errors.array() });
    } else {
      try {
        
        const assignedCheck = await utils.sqlQuery(
          "SELECT ag.agreement_title,ag.agreement_accountno,a.agreement_id,a.accountno,a.is_signed,a.ismandatory,a.signed_date,a.signature_path,a.pdf_path,a.agreement_status FROM agreements ag, user_agreements a WHERE a.accountno = ? AND a.agreement_id = ag.agreement_id",
          [req.body.agent_accountno]
        );
        if (assignedCheck.length > 0) {
          
          res.json({ status: 200, message: "success", agreements:assignedCheck });
        } else {
          res.json({ status: 404, message: "not_found" });
        }
        
      } catch (e) {
        console.log(e.message);
        res.json({
          status: 405,
          message: e.message,
          errors: {
            message: e.message,
          },
        });
      }
    }
  },
  function (error) {
    
    res.json({
      status: 406,
      message: error.message,
      errors: {
        message: error.code,
      },
    });
  }
);

router.post(
  "/revoke_agent_signed_agreements",
  utils.validateAccount,
  upload.none(),
  //upload.single('rate_deck_file'),
  [
    check("accountno").not().isEmpty().trim(),
    check("agent_accountno").not().isEmpty().trim(),
    check("agreement_id").not().isEmpty().trim(),
    check("agreement_accountno").not().isEmpty().trim(),
    check("revoke_reason").not().isEmpty().trim(),
    check("agent_email").not().isEmpty().trim(),
    check("sign_agreement_link").not().isEmpty().trim(),
    check("agent_name").not().isEmpty().trim(),
  ],
  async (req, res) => {
    //console.log('revoke_agent_signed_agreements before api call',req.body);
    const errors = validationResult(req.body);
    
    if (!errors.isEmpty()) {
      return res.json({ status: 404, errors: errors.array() });
    } else {
      try {
        const userAgreementsInfo = await utils.sqlQuery(
          "SELECT signed_date, signature_path, pdf_path FROM user_agreements WHERE accountno = ? AND agreement_id = ? AND reseller_accountno = ?",
          [req.body.agent_accountno, req.body.agreement_id, req.body.accountno]
        );

        if(userAgreementsInfo.length > 0){
          await utils.sqlQuery("INSERT INTO revoked_agreements set ?", {
            agent_accountno: req.body.agent_accountno,
            agreement_id: req.body.agreement_id,
            revoke_date: new Date(),
            signed_date: userAgreementsInfo[0]['signed_date'],
            revoke_reason: req.body.revoke_reason,
            email_sent: 'Yes',
            reseller_accountno: req.body.accountno,
            signature_path: userAgreementsInfo[0]['signature_path'],
            pdf_path: userAgreementsInfo[0]['pdf_path'],
            agreement_status: 'Pending',
          });

          await utils.sqlQuery(
            `UPDATE user_agreements
            SET ? 
            WHERE accountno=${req.body.agent_accountno}  
            AND agreement_id=${req.body.agreement_id} 
            AND reseller_accountno=${req.body.accountno} 
             `,
          [
            {
              is_signed: 'No',
              signed_date: null,
              signature_path: null,
              pdf_path: null,
            },
          ]
          );

          const emailInfo = await utils.sqlQuery(
            "SELECT * FROM tbl_canned_email WHERE id = ? AND type = ?",
            [6, "other"]
          );
  
          const resellerInfo = await utils.sqlQuery(
            "SELECT * FROM resellers WHERE reseller_accountno = ?",
            [req.body.accountno]
          );
  
          let reseller_comp = resellerInfo[0]['reseller_comp'];
          let reseller_logo = environment.RES_PORTAL_URL+"files_data/logos/"+resellerInfo[0]['logo'];
          await utils.emailSendRevoke(
            req.body.agent_email,
            emailInfo[0]["subject"],
            emailInfo[0]["template"],
            new Date(),           
            reseller_comp,
            reseller_logo,
            req.body.sign_agreement_link,
            req.body.revoke_reason,
            req.body.agent_name
          );

          res.json({ status: 200, message: "success"}); 

        }
        else{
          res.json({ status: 404, message: "not_found" });
        }


               
      } catch (e) {
        console.log(e.message);
        res.json({
          status: 405,
          message: e.message,
          errors: {
            message: e.message,
          },
        });
      }
    }
  },
  function (error) {
    
    res.json({
      status: 406,
      message: error.message,
      errors: {
        message: error.code,
      },
    });
  }
);

router.post(
  "/send_unsigned_agent_email",
  utils.validateAccount,
  upload.none(),
  //upload.single('rate_deck_file'),
  [
    check("accountno").not().isEmpty().trim(),
    check("agent_accountno").not().isEmpty().trim(),
    check("agreement_id").not().isEmpty().trim(),
    check("agreement_accountno").not().isEmpty().trim(),
    check("agent_email").not().isEmpty().trim(),
    check("sign_agreement_link").not().isEmpty().trim(),
    check("agent_name").not().isEmpty().trim(),
  ],
  async (req, res) => {
    //console.log('revoke_agent_signed_agreements before api call',req.body);
    const errors = validationResult(req.body);
    
    if (!errors.isEmpty()) {
      return res.json({ status: 404, errors: errors.array() });
    } else {
      try {
        await utils.sqlQuery("INSERT INTO unsigned_agreement_emails set ?", {
          agent_accountno: req.body.agent_accountno,
          agreement_id: req.body.agreement_id,
          email_date: new Date(),
          email_sent: 'Yes',
          reseller_accountno: req.body.accountno,
        });

        //console.log("insertQry: ",insertQry.insertId);
        const emailInfo = await utils.sqlQuery(
          "SELECT * FROM tbl_canned_email WHERE id = ? AND type = ?",
          [7, "other"]
        );

        const resellerInfo = await utils.sqlQuery(
          "SELECT * FROM resellers WHERE reseller_accountno = ?",
          [req.body.accountno]
        );

        let reseller_comp = resellerInfo[0]['reseller_comp'];
        let reseller_logo = environment.RES_PORTAL_URL+"files_data/logos/"+resellerInfo[0]['logo'];
        await utils.emailSendUnsignedAgreement(
          req.body.agent_email,
          emailInfo[0]["subject"],
          emailInfo[0]["template"],
          new Date(),           
          reseller_comp,
          reseller_logo,
          req.body.sign_agreement_link,
          req.body.agent_name
        );

        res.json({ status: 200, message: "success"}); 
              
      } catch (e) {
        console.log(e.message);
        res.json({
          status: 405,
          message: e.message,
          errors: {
            message: e.message,
          },
        });
      }
    }
  },
  function (error) {
    
    res.json({
      status: 406,
      message: error.message,
      errors: {
        message: error.code,
      },
    });
  }
);

router.post(
  "/send_unsigned_client_email",
  utils.validateAccount,
  upload.none(),
  //upload.single('rate_deck_file'),
  [
    check("accountno").not().isEmpty().trim(),
    check("agent_accountno").not().isEmpty().trim(),
    check("agreement_accountno").not().isEmpty().trim(),
    check("sign_agreement_link").not().isEmpty().trim(),
    check("client_id").not().isEmpty().trim(),
  ],
  async (req, res) => {
    //console.log('revoke_agent_signed_agreements before api call',req.body);
    const errors = validationResult(req.body);
    
    if (!errors.isEmpty()) {
      return res.json({ status: 404, errors: errors.array() });
    } else {
      try {
        const clientInfo = await utils.sqlQuery(
          "SELECT name, accountno, email FROM clients WHERE id = ? AND agent_accountno = ?",
          [req.body.client_id,req.body.agent_accountno]
        );
        if(clientInfo.length > 0){
          await utils.sqlQuery("INSERT INTO client_unsigned_agreement_emails set ?", {
            agent_accountno: req.body.agent_accountno,
            agreement_accountno: req.body.agreement_accountno,
            email_date: new Date(),
            email_sent: 'Yes',
            client_accountno: clientInfo[0]['accountno'],
          });
  
          //console.log("insertQry: ",insertQry.insertId);
          const emailInfo = await utils.sqlQuery(
            "SELECT * FROM tbl_canned_email WHERE id = ? AND type = ?",
            [7, "other"]
          );
  
          const resellerInfo = await utils.sqlQuery(
            "SELECT * FROM resellers WHERE reseller_accountno = ?",
            [req.body.accountno]
          );
  
          let reseller_comp = resellerInfo[0]['reseller_comp'];
          let reseller_logo = environment.RES_PORTAL_URL+"files_data/logos/"+resellerInfo[0]['logo'];
          await utils.emailSendUnsignedAgreement(
            clientInfo[0]['email'],
            emailInfo[0]["subject"],
            emailInfo[0]["template"],
            new Date(),           
            reseller_comp,
            reseller_logo,
            req.body.sign_agreement_link,
            clientInfo[0]['name']
          );
  
          res.json({ status: 200, message: "success"}); 
        }
        else{
          res.json({ status: 404, message: "client_not_found" });
        }
              
      } catch (e) {
        console.log(e.message);
        res.json({
          status: 405,
          message: e.message,
          errors: {
            message: e.message,
          },
        });
      }
    }
  },
  function (error) {
    
    res.json({
      status: 406,
      message: error.message,
      errors: {
        message: error.code,
      },
    });
  }
);

router.post(
  "/submit_client_services_data",
  utils.validateAccount,
  upload.none(),
  //upload.single('rate_deck_file'),
  [
    check("accountno").not().isEmpty().trim(),
    check("client_id").not().isEmpty().trim(),
    check("welcome_content").not().isEmpty().trim(),
    check("agent_accountno").not().isEmpty().trim(),
    check("email").not().isEmpty().trim(),    
  ],
  async (req, res) => {
    //console.log('revoke_agent_signed_agreements before api call',req.body);
    const errors = validationResult(req.body);
    
    if (!errors.isEmpty()) {
      return res.json({ status: 404, errors: errors.array() });
    } else {
      try {
        const clientInfo = await utils.sqlQuery(
          "SELECT name, accountno, email FROM clients WHERE id = ? AND agent_accountno = ?",
          [req.body.client_id,req.body.agent_accountno]
        );
        if(clientInfo.length > 0){
          const clientServicesDataInfo = await utils.sqlQuery(
            "SELECT client_accountno FROM client_services_data WHERE agent_accountno = ? AND client_accountno = ?",
            [req.body.agent_accountno,clientInfo[0]['accountno']]
          );
          if(clientServicesDataInfo.length > 0){
            await utils.sqlQuery(
              `UPDATE client_services_data
              SET ? 
              WHERE client_accountno=${clientInfo[0]['accountno']} 
              AND agent_accountno=${req.body.agent_accountno} 
               `,
            [
              {
                welcome_content: req.body.welcome_content,
                email: req.body.email,
                submitted_date: new Date(),                
              },
            ]
            );
          }
          else{
            await utils.sqlQuery("INSERT INTO client_services_data set ?", {
              agent_accountno: req.body.agent_accountno,
              welcome_content: req.body.welcome_content,
              submitted_date: new Date(),
              email: req.body.email,
              client_accountno: clientInfo[0]['accountno'],
            });
          }                    
          res.json({ status: 200, message: "success"}); 
        }
        else{
          res.json({ status: 404, message: "client_not_found" });
        }
              
      } catch (e) {
        console.log(e.message);
        res.json({
          status: 405,
          message: e.message,
          errors: {
            message: e.message,
          },
        });
      }
    }
  },
  function (error) {
    
    res.json({
      status: 406,
      message: error.message,
      errors: {
        message: error.code,
      },
    });
  }
);

router.post(
  "/list_assigned_services_agreements",
  utils.validateAccount,
  upload.none(),
  //upload.single('rate_deck_file'),
  [
    check("agent_accountno").not().isEmpty().trim(),
    check("agreement_accountno").not().isEmpty().trim(),
  ],
  async (req, res) => {
    //console.log('revoke_agent_signed_agreements before api call',req.body);
    const errors = validationResult(req.body);
    
    if (!errors.isEmpty()) {
      return res.json({ status: 404, errors: errors.array() });
    } else {
      try {
        //console.log('list_assigned_services_agreements',req.body.agent_accountno,req.body.agreement_accountno);
        const clientInfo = await utils.sqlQuery(
          "SELECT name, accountno, email FROM clients WHERE id = ? AND agent_accountno = ?",
          [1,req.body.agent_accountno]
        );
        //console.log('clientInfo',clientInfo);
        if(clientInfo.length > 0){
          const assignedCheck = await utils.sqlQuery(
            "SELECT ag.agreement_title,ag.agreement_accountno,a.agreement_accountno,a.accountno,a.is_signed,a.ismandatory,a.signed_date,a.signature_path,a.pdf_path FROM client_agreements ag, client_signed_agreements a WHERE a.accountno = ? AND a.agreement_accountno = ag.agreement_accountno",
            [clientInfo[0]['accountno']]
          );
          //console.log('assignedCheck',assignedCheck);
          // const clientAgreementsInfo = await utils.sqlQuery(
          //   "SELECT * FROM client_signed_agreements WHERE accountno = ? AND agent_accountno = ? AND agreement_accountno IN (?)",
          //   [clientInfo[0]['accountno'], req.body.agent_accountno, req.body.agreement_accountno]
          // );
          if(assignedCheck.length > 0){
            res.json({ status: 200, message: "success", clientAgreementsInfo: assignedCheck});
          }
          else{
            res.json({ status: 200, message: "success", clientAgreementsInfo: []});
          }
        }
        else{
          res.json({ status: 404, message: "client_not_found" });
        }
      
      } catch (e) {
        //console.log('Exception', e);
        res.json({
          status: 405,
          message: e.message,
          errors: {
            message: e.message,
          },
        });
      }
    }
  },
  function (error) {
    
    res.json({
      status: 406,
      message: error.message,
      errors: {
        message: error.code,
      },
    });
  }
);

router.post(
  "/revoke_client_signed_agreements",
  utils.validateAccount,
  upload.none(),
  //upload.single('rate_deck_file'),
  [    
    check("agent_accountno").not().isEmpty().trim(),    
    check("agreement_accountno").not().isEmpty().trim(),
    check("revoke_reason").not().isEmpty().trim(),
    check("sign_agreement_link").not().isEmpty().trim(),
    check("reseller_accountno").not().isEmpty().trim(),
    check("client_id").not().isEmpty().trim(),    
  ],
  async (req, res) => {
    //console.log('revoke_agent_signed_agreements before api call',req.body);
    const errors = validationResult(req.body);
    
    if (!errors.isEmpty()) {
      return res.json({ status: 404, errors: errors.array() });
    } else {
      try {
        //console.log('revoke_client_signed_agreements',req.body);
        const clientInfo = await utils.sqlQuery(
          "SELECT name, accountno, email FROM clients WHERE id = ? AND agent_accountno = ?",
          [req.body.client_id,req.body.agent_accountno]
        );
        //console.log('clientInfo',clientInfo);
        if(clientInfo.length > 0){
          const clientAgreementsInfo = await utils.sqlQuery(
            "SELECT signed_date, signature_path, pdf_path FROM client_signed_agreements WHERE accountno = ? AND agreement_accountno = ? AND agent_accountno = ?",
            [clientInfo[0]['accountno'], req.body.agreement_accountno, req.body.agent_accountno]
          );
          //console.log('clientAgreementsInfo',clientAgreementsInfo);

          if(clientAgreementsInfo.length > 0){
            await utils.sqlQuery("INSERT INTO client_revoked_agreements set ?", {
              agent_accountno: req.body.agent_accountno,
              agreement_accountno: req.body.agreement_accountno,
              revoke_date: new Date(),
              signed_date: clientAgreementsInfo[0]['signed_date'],
              revoke_reason: req.body.revoke_reason,
              email_sent: 'Yes',
              client_accountno: clientInfo[0]['accountno'],
              signature_path: clientAgreementsInfo[0]['signature_path'],
              pdf_path: clientAgreementsInfo[0]['pdf_path'],
              agreement_status: 'Pending',
            });
  
            await utils.sqlQuery(
              `UPDATE client_signed_agreements
              SET ? 
              WHERE accountno=${clientInfo[0]['accountno']}  
              AND agreement_accountno=${req.body.agreement_accountno} 
              AND agent_accountno=${req.body.agent_accountno} 
               `,
            [
              {
                is_signed: 'No',
                signed_date: null,
                signature_path: null,
                pdf_path: null,
              },
            ]
            );
  
            const emailInfo = await utils.sqlQuery(
              "SELECT * FROM tbl_canned_email WHERE id = ? AND type = ?",
              [6, "other"]
            );
    
            const resellerInfo = await utils.sqlQuery(
              "SELECT * FROM resellers WHERE reseller_accountno = ?",
              [req.body.reseller_accountno]
            );
    
            let reseller_comp = resellerInfo[0]['reseller_comp'];
            let reseller_logo = environment.RES_PORTAL_URL+"files_data/logos/"+resellerInfo[0]['logo'];
            await utils.emailSendClientRevoke(
              clientInfo[0]['email'],
              emailInfo[0]["subject"],
              emailInfo[0]["template"],
              new Date(),           
              reseller_comp,
              reseller_logo,
              req.body.sign_agreement_link,
              req.body.revoke_reason,
              clientInfo[0]['name']
            );
  
            res.json({ status: 200, message: "success"}); 
  
          }
          else{
            res.json({ status: 404, message: "not_found" });
          }
        }
        else{
          res.json({ status: 404, message: "client_not_found" });
        }



               
      } catch (e) {
        console.log('Exception',e);
        res.json({
          status: 405,
          message: e.message,
          errors: {
            message: e.message,
          },
        });
      }
    }
  },
  function (error) {
    
    res.json({
      status: 406,
      message: error.message,
      errors: {
        message: error.code,
      },
    });
  }
);

module.exports = router;
