"use strict"

const express = require("express")
const helmet = require("helmet")
const path = require("path")
const morgan = require("morgan")
const logger = require("./logger")
const { toggleRelay } = require("./gpio")
const { getMqttBrokerStatus, garageState } = require("./pub-sub")
require("dotenv").config()

const app = express()
const PORT = 8080

app.use(express.json())
app.use(helmet())
app.use(express.static("public"))
app.use("/assets", express.static("assets"))
app.use(
  morgan("combined", {
    skip: (req, res) => req.url === "/health",
  })
)

function getState() {
  return {
    open: garageState(),
    brokerConnected: getMqttBrokerStatus(),
  }
}

app.get("/status", function (req, res) {
  res.send(JSON.stringify(getState()))
})

app.post("/relay", function (req, res) {
  logger.info("Relay toggled")
  toggleRelay()
  res.redirect("/")
})

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`)
})
