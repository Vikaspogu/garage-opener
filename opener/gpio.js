"use strict";

const rpio = require("rpio");
require("dotenv").config();

// default: 38-open, 11-relay
const openPin = process.env.OPEN_PIN || 38;
const relayPin = process.env.RELAY_PIN || 11;

rpio.open(openPin, rpio.INPUT, rpio.PULL_UP);
rpio.open(relayPin, rpio.OUTPUT, rpio.HIGH);

module.exports = {
  pinState: () => {
    return !rpio.read(openPin);
  },

  toggleRelay: () => {
    // Simulate a button press
    rpio.write(relayPin, rpio.LOW);
    setTimeout(async function () {
      rpio.write(relayPin, rpio.HIGH);
    }, 1000);
    return;
  },
};
