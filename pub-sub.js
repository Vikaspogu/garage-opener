"use strict"

const mqtt = require("mqtt")
const logger = require("./logger")
const { toggleRelay } = require("./gpio")
const MQTT_BROKER = process.env.MQTT_BROKER
const clientId = "mqttjs_" + Math.random().toString(6)
const client = mqtt.connect(`mqtt://${MQTT_BROKER}`, {
  clientId: clientId,
  protocolId: "MQTT",
  protocolVersion: 4,
  clean: false,
  reconnectPeriod: 1,
  will: {
    topic: "WillMsg",
    payload: "Connection Closed abnormally..!",
    qos: 1,
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

client.on("error", function (err) {
  logger.info("Error: " + err)
  if (err.code == "ENOTFOUND") {
    logger.info(
      "Network error, make sure you have an active internet connection"
    )
  }
})

client.on("close", () => {
  client.publish("garage/availability", "offline")
  logger.info("Connection closed by client")
})

client.on("reconnect", function () {
  logger.info("Client trying a reconnection")
})

function handleGarageCommands(message) {
  let messageStrLwrcase = message.toString().toLowerCase()
  logger.info(
    "incoming state for garage %s; current state %s",
    messageStrLwrcase,
    garageState
  )
  if (
    garageState == "" ||
    messageStrLwrcase == "" ||
    garageState.includes(messageStrLwrcase)
  ) {
    logger.info(
      "not a valid state for incoming message %s; current state %s",
      messageStrLwrcase,
      garageState
    )
    return
  }
  if (messageStrLwrcase == "open" || messageStrLwrcase == "close") {
    toggleRelay()
  }
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
