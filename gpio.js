"use strict";

const rpio = require("rpio");
const logger = require("./logger");
require("dotenv").config();

// default: 11-relay
const relayPin = process.env.RELAY_PIN || 11;

rpio.init({gpiomem: false}); 
rpio.open(relayPin, rpio.OUTPUT, rpio.HIGH);

module.exports = {
  toggleRelay: () => {
    // Simulate a button press
    logger.info("toggling relay...");
    rpio.write(relayPin, rpio.LOW);
    setTimeout(async function () {
      rpio.write(relayPin, rpio.HIGH);
    }, 1000);
    return;
  },
};
