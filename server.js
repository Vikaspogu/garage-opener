"use strict";

const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const schedule = require("node-schedule");
const morgan = require("morgan");
const logger = require("./logger");
const notification = require("./notification");
const { pinState, toggleRelay } = require("./gpio");
const { getMqttBrokerStatus } = require("./pub-sub");
require("dotenv").config();

const app = express();
const PORT = 8080;

let notifications = true;
const garageNotification = {
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

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));
app.use("/assets", express.static("assets"));
app.use(
  morgan("common", {
    skip: (req, res) => req.url === "/health",
  })
);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

function getState() {
  return {
    open: pinState(),
    notifications: notifications,
    brokerConnected: getMqttBrokerStatus(),
  };
}

app.get("/", function (req, res) {
  res.render("index", getState());
});

app.get("/health", function (req, res) {
  res.send("UP");
});

app.get("/status", function (req, res) {
  res.send(JSON.stringify(getState()));
});

app.post("/relay", function (req, res) {
  toggleRelay();
  res.redirect("/");
});

app.post("/toggleNotifications", function (req, res) {
  notifications = !notifications;
  res.redirect("/");
});

schedule.scheduleJob("*/30 * * * *", function () {
  if (notifications) {
    var status = JSON.parse(JSON.stringify(getState()));
    if (status.open) {
      notification.sendSlackNotification(garageNotification);
    }
  }
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});