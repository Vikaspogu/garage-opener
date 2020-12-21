"use strict";

const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const logger = require("./logger");
const notification = require("./notification");
const {
  pinState,
  toggleRelay,
  getStateOfPins,
  changeState,
} = require("./gpio");
const { getMqttBrokerStatus } = require("./pub-sub");
const { log } = require("util");
require("dotenv").config();

const app = express();
const PORT = 8080;

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
    notifications: notification.notificationsStatus(),
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

app.get("/allPins", function (req, res) {
  res.send(JSON.stringify(getStateOfPins()));
});

app.post("/relay", function (req, res) {
  toggleRelay();
  res.redirect("/");
});

app.post("/toggleNotifications", function (req, res) {
  notification.toggleNotifications();
  res.redirect("/");
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
