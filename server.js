"use strict";

const express = require("express");
const helmet = require("helmet");
const path = require("path");
const morgan = require("morgan");
const client = require("prom-client");
const logger = require("./logger");
const notification = require("./notification");
const { toggleRelay } = require("./gpio");
const { getMqttBrokerStatus, garageState } = require("./pub-sub");
require("dotenv").config();

const app = express();
const PORT = 8080;

app.use(express.json());
app.use(helmet());
app.use(express.static("public"));
app.use("/assets", express.static("assets"));
app.use(
  morgan("common", {
    skip: function (req, res) {
      return req.url == "/health";
    },
    skip: function (req, res) {
      return req.url == "/metrics";
    },
  })
);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

function getState() {
  return {
    open: garageState(),
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

app.post("/relay", function (req, res) {
  logger.info("Relay toggled");
  toggleRelay();
  res.redirect("/");
});

app.post("/toggleNotifications", function (req, res) {
  logger.info("Notifications toggled");
  notification.toggleNotifications();
  res.redirect("/");
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
