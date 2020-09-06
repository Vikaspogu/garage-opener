const { createLogger, format, transports } = require("winston");
const { combine, timestamp, label, prettyPrint } = format;

// instantiate a new Winston Logger with the settings defined above
const logger = createLogger({
  format: combine(format.splat(), format.simple(), timestamp(), prettyPrint()),
  transports: [
    new transports.Console(),
    new transports.Http({
      level: "warn",
      format: format.json(),
    }),
  ],
  exitOnError: false, // do not exit on handled exceptions
});

module.exports = logger;
