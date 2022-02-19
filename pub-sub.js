"use strict"

const mqtt = require("mqtt")
const logger = require("./logger")
const { toggleRelay } = require("./gpio")
const MQTT_BROKER = process.env.MQTT_BROKER
const clientId = "mqttjs_" + Math.random().toString(16).substr(2, 8)
const client = mqtt.connect(`mqtt://${MQTT_BROKER}`, {
  keepalive: 30,
  clientId: clientId,
  protocolId: "MQTT",
  protocolVersion: 4,
  clean: false,
  reconnectPeriod: 1000,
  connectTimeout: 30 * 1000,
  will: {
    topic: "WillMsg",
    payload: "Connection Closed abnormally..!",
    qos: 0,
    retain: false,
  },
})

let garageState = ""
let availability = ""

client.on("connect", () => {
  client.subscribe("garage/set")
  client.subscribe("zigbee2mqtt/GarageDoor")
  client.subscribe("garage/availability")

  client.publish("garage/availability", "online")
})

client.on("message", (topic, message) => {
  switch (topic) {
    case "garage/availability":
      availability = message.toString()
      return
    case "zigbee2mqtt/GarageDoor":
      var jsonObj = JSON.parse(message)
      var messageState = jsonObj.contact == true ? "closed" : "open"
      if (garageState != messageState) {
        logger.info(
          "Garage state %s, incoming message %s",
          garageState,
          messageState
        )
      }
      garageState = messageState
      return
    case "garage/set":
      return handleGarageCommands(message)
  }
  logger.info("No handler for topic %s", topic)
})

client.on("close", () => {
  client.publish("garage/availability", "offline")
})

function handleGarageCommands(message) {
  let messageStrLwrcase = message.toString().toLowerCase()
  logger.info("garage state update to %s", messageStrLwrcase)
  if (
    garageState == "" ||
    garageState == "home" ||
    garageState.includes(messageStrLwrcase)
  ) {
    return
  }
  toggleRelay()
  client.publish("garage/set", "")
}

setInterval(function () {
  if (client.connected) {
    client.publish("garage/availability", "online")
  }
}, 1000)

module.exports = {
  garageState: () => {
    return garageState
  },
  getMqttBrokerStatus: () => {
    return client.connected
  },
}
