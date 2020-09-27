const https = require("https");
require("dotenv").config();

const webhookURL = process.env.SLACK_WEBHOOK;
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const sendSlackNotification = (messageBody) => {
  messageBody = JSON.stringify(messageBody);
  const requestOptions = {
    method: "POST",
    header: {
      "Content-Type": "application/json",
    },
  };
  // actual request
  const req = https.request(webhookURL, requestOptions, (res) => {
    let response = "";
    res.on("data", (d) => {
      response += d;
    });
  });
  // send our message body (was parsed to JSON beforehand)
  req.write(messageBody);
  req.end();
};

const sendSms = (phone, message) => {
  const client = require("twilio")(accountSid, authToken);
  client.messages
    .create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    })
    .then((message) => console.log(message.sid));
};

module.exports = {
  sendSlackNotification,
  sendSms,
};
