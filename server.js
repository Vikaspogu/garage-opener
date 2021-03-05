"use strict";

const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const client = require("prom-client");
const logger = require("./logger");
const notification = require("./notification");
const { pinState, toggleRelay, getStateOfPins } = require("./gpio");
const { getMqttBrokerStatus } = require("./pub-sub");
require("dotenv").config();

const app = express();
const PORT = 8080;
// Create a Registry which registers the metrics
const register = new client.Registry();
// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: "garage-opener",
});
// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));
app.use("/assets", express.static("assets"));
app.use(
  morgan("common", {
    skip: (req, res) => req.url === "/health",
    skip: (req, res) => req.url === "/metrics",
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
  logger.info("Get state of pins");
  res.send(JSON.stringify(getStateOfPins()));
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

app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
