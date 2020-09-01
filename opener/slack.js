const https = require("https");
require("dotenv").config();

const webhookURL = process.env.SLACK_WEBHOOK;

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

module.exports = sendSlackNotification;
