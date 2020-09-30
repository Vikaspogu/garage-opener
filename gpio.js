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

  getStateOfPins: () => {
    return {
      40: !rpio.read(40),
      38: !rpio.read(38),
      37: !rpio.read(37),
      36: !rpio.read(36),
      35: !rpio.read(35),
      33: !rpio.read(33),
      32: !rpio.read(32),
      31: !rpio.read(31),
      29: !rpio.read(29),
      22: !rpio.read(22),
      18: !rpio.read(18),
      16: !rpio.read(16),
      15: !rpio.read(15),
      13: !rpio.read(13),
      12: !rpio.read(12),
      11: !rpio.read(11),
    };
  },

  changeState: (pin) => {
    rpio.write(pin, rpio.PULL_DOWN);
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
