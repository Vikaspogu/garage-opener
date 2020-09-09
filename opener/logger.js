const { createLogger, format, transports } = require("winston");
const moment = require("moment-timezone");
const { combine, timestamp, label, prettyPrint } = format;

const appendTimestamp = format((info, opts) => {
  if (opts.tz) info.timestamp = moment().tz(opts.tz).format();
  return info;
});

// instantiate a new Winston Logger with the settings defined above
const logger = createLogger({
  format: combine(
    format.splat(),
    format.simple(),
    appendTimestamp({ tz: "America/Chicago" }),
    prettyPrint()
  ),
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
