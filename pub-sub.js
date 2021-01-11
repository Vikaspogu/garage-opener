"use strict";

const mqtt = require("mqtt");
const logger = require("./logger");
const { pinState, toggleRelay } = require("./gpio");
const notification = require("./notification");
const MQTT_BROKER = process.env.MQTT_BROKER;
const clientId = "mqttjs_" + Math.random().toString(16).substr(2, 8);
const client = mqtt.connect(`mqtt://${MQTT_BROKER}`, {
  keepalive: 30,
  clientId: clientId,
  protocolId: "MQTT",
  protocolVersion: 4,
  clean: true,
  reconnectPeriod: 1000,
  connectTimeout: 30 * 1000,
  will: {
    topic: "WillMsg",
    payload: "Connection Closed abnormally..!",
    qos: 0,
    retain: false,
  },
});

let garageState = "";
let availability = "";

client.on("connect", () => {
  client.subscribe("garage/set");
  client.subscribe("garage/state");
  client.subscribe("garage/availability");

  client.publish("garage/availability", "online");
});

client.on("message", (topic, message) => {
  let messageStr = message.toString();
  switch (topic) {
    case "garage/availability":
      availability = messageStr;
      return;
    case "garage/state":
      if (garageState != messageStr) {
        logger.info(
          "Garage state %s, incoming message %s",
          garageState,
          messageStr
        );
        notification.startStopTimer(messageStr);
      }
      garageState = messageStr;
      return;
    case "garage/set":
      return handleGarageCommands(message);
  }
  logger.info("No handler for topic %s", topic);
});

client.on("close", () => {
  client.publish("garage/availability", "offline");
});

function handleGarageCommands(message) {
  let messageStrLwrcase = message.toString().toLowerCase();
  if (garageState == "" || garageState.includes(messageStrLwrcase)) {
    return;
  }
  logger.info("garage state update to %s", messageStrLwrcase);
  toggleRelay();
}

setInterval(function () {
  if (client.connected) {
    const pubState = pinState() ? "open" : "closed";
    client.publish("garage/state", pubState);
    client.publish("garage/availability", "online");
  }
}, 4000);

module.exports = {
  getMqttBrokerStatus: () => {
    return client.connected;
  },
};
