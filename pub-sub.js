"use strict";

const mqtt = require("mqtt");
const logger = require("./logger");
const { pinState, toggleRelay } = require("./gpio");
const MQTT_BROKER = process.env.MQTT_BROKER;
const client = mqtt.connect(`mqtt://${MQTT_BROKER}`, {
  clientId: "mqttjs_garageopener",
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
  switch (topic) {
    case "garage/availability":
      availability = message.toString();
      return;
    case "garage/state":
      garageState = message.toString();
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
  if (
    garageState == "" ||
    garageState.includes(message.toString().toLowerCase())
  ) {
    return;
  }
  logger.info("garage state update to %s", message.toString());
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
