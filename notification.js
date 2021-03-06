const https = require("https");
const logger = require("./logger");
require("dotenv").config();

const webhookURL = process.env.SLACK_WEBHOOK;
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const garageNotificationBody = {
  username: "Garage notifier",
  text: "Garage door is Open",
  icon_emoji: ":bangbang:",
  attachments: [
    {
      color: "#FF0000",
      fields: [
        {
          title: "Environment",
          value: process.env.ENVIRONMENT,
          short: true,
        },
      ],
    },
  ],
};
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
  logger.info("Sending slack notification");
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

let enableNotifications = true;
var timeout;

function notificationTimer() {
  timeout = setTimeout(() => {
    if (enableNotifications) {
      sendSlackNotification(garageNotificationBody);
    }
  }, process.env.NOTIFICATION_TIME);
}

const startStopTimer = (state) => {
  if (state.toLowerCase() == "open") {
    logger.info("Start notification timer");
    notificationTimer();
  } else if (state.toLowerCase() == "closed") {
    logger.info("Stop notification timer");
    clearTimeout(timeout);
  }
};

module.exports = {
  sendSlackNotification,
  sendSms,
  startStopTimer,
  notificationsStatus: () => {
    return enableNotifications;
  },
  toggleNotifications: () => {
    enableNotifications = !enableNotifications;
  },
};
