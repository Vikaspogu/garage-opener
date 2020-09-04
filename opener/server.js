"use strict";

const express = require("express");
const rpio = require("rpio");
const path = require("path");
const bodyParser = require("body-parser");
const schedule = require("node-schedule");
const morgan = require("morgan");
const mqtt = require("mqtt");
const logger = require("./logger");
const sendSms = require("./twilio");
const sendSlackNotification = require("./slack");
require("dotenv").config();

const app = express();
const PORT = 8080;

const MQTT_BROKER = process.env.MQTT_BROKER;
const client = mqtt.connect(`mqtt://${MQTT_BROKER}`);

let sendNotifications = true;
let garageState = "";
let availability = "";
let state = "";

rpio.init({
  gpiomem: true,
  mapping: "physical",
  close_on_exit: true,
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));
app.use("/assets", express.static("assets"));
app.use(morgan("common"));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

// default: 33-open, 11-relay
const openPin = process.env.OPEN_PIN || 33;
const relayPin = process.env.RELAY_PIN || 11;

rpio.open(openPin, rpio.INPUT, rpio.PULL_UP);
rpio.open(relayPin, rpio.OUTPUT, rpio.HIGH);

function getState() {
  return {
    open: !rpio.read(openPin),
    sendNotifications: sendNotifications,
    brokerConnected: client.connected,
  };
}

app.get("/", function (req, res) {
  res.render("index", getState());
});

app.get("/status", function (req, res) {
  res.send(JSON.stringify(getState()));
});

app.post("/relay", function (req, res) {
  // Simulate a button press
  let currentState = !rpio.read(openPin);
  rpio.write(relayPin, rpio.LOW);
  setTimeout(async function () {
    let count = 1;
    rpio.write(relayPin, rpio.HIGH);
    while (currentState && count < 20) {
      logger.info(`Current state ${currentState}; Seconds taking ${count}..`);
      currentState = !rpio.read(openPin);
      count++;
      await sleep(1000);
    }
    res.redirect("/");
  }, 1000);
});

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

app.post("/toggleNotifications", function (req, res) {
  sendNotifications = !sendNotifications;
  res.redirect("/");
});

schedule.scheduleJob("*/15 * * * *", function () {
  if (sendNotifications) {
    var status = JSON.parse(JSON.stringify(getState()));
    if (status.open) {
      // sendSms("18148731986", "Garage door is open 🔥");
      sendSlackNotification(garageNotification);
    }
  }
});

const garageNotification = {
  username: "Garage notifier", // This will appear as user name who posts the message
  text: "Garage door is Open for 15 minutes.", // text
  icon_emoji: ":bangbang:", // User icon, you can also use custom icons here
  attachments: [
    {
      // this defines the attachment block, allows for better layout usage
      color: "#FF0000", // color of the attachments sidebar.
      fields: [
        // actual fields
        {
          title: "Environment", // Custom field
          value: process.env.ENVIRONMENT, // Custom value
          short: true, // long fields will be full width
        },
      ],
    },
  ],
};

//////////////////////////
/////////////////////////
client.on("connect", () => {
  client.subscribe("garage/set");
  client.subscribe("garage/state");
  client.subscribe("garage/availability");

  client.publish("garage/availability", "online");
});

client.on("message", (topic, message) => {
  switch (topic) {
    case "garage/availability":
      availability = message.toString();
      return;
    case "garage/state":
      garageState = message;
      return;
    case "garage/set":
      return handleGarageCommands(message);
  }
  console.log("No handler for topic %s", topic);
});

client.on("close", () => {
  client.publish("garage/availability", "offline");
});

function handleGarageCommands(message) {
  console.log("garage state update to %s", message.toString());
  rpio.write(relayPin, rpio.LOW);
  setTimeout(function () {
    rpio.write(relayPin, rpio.HIGH);
  }, 1000);
}

setInterval(function () {
  if (client.connected) {
    const pubState = !rpio.read(openPin) ? "open" : "closed";
    client.publish("garage/state", pubState);
    client.publish("garage/availability", "online");
  }
}, 10000);

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
