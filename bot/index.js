// Load environment variables from `.env` file (optional)
require("dotenv").config();

const { App } = require("@slack/bolt");
const axios = require("axios");

const bot = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN,
  endpoints: "/slack/events",
});

const axiosInstance = axios.create({
  baseURL: "http://garage-opener:8080/",
});

bot.event("app_mention", async ({ context, event }) => {
  try {
    const command = event.text;
    let reply;
    if (command.includes("close") || command.includes("open")) {
      reply = await changeState();
    } else {
      const response = await getStatus();
      reply = response.data.open ? "Open 🔥" : "Closed 	✅";
    }
    await bot.client.chat.postMessage({
      token: context.botToken,
      channel: event.channel,
      text: `${reply}`,
    });
  } catch (e) {
    console.log(`error responding ${e}`);
  }
});

const getStatus = async () => {
  try {
    return await axiosInstance.get("status");
  } catch (error) {
    console.error(error);
  }
};

const changeState = async () => {
  try {
    return await axiosInstance.post("changeState").then(
      (res) => {
        return res.data.open ? "Closing ⬇️⬇️⬇️" : "Opening 	⬆️⬆️⬆️";
      },
      (error) => {
        return "Error has occured ❌❌";
      }
    );
  } catch (error) {
    console.error(error);
  }
};

// *** Handle errors ***
bot.event("error", (error) => {
  console.error(
    `An error occurred while handling a Slack event: ${error.message}`
  );
});

// Start the express application
(async () => {
  // Start the app
  await bot.start(process.env.PORT || 8080);

  console.log("⚡️ Bolt app is running!");
})();
