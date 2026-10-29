/**
 * JARiF Discord SelfBot Edition
 * Main Entry Point
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Client } = require("discord.js-selfbot-v13");
const logger = require("./core/logger");
const { initGlobal, loadAllCommands, loadAllEvents } = require("./core/loader");
const { handleMessage, handleReaction } = require("./core/handlers");

// 1. Display banner
logger.banner();

// 2. Load Configuration
const configPath = path.join(__dirname, "config.json");
let config = {};
if (fs.existsSync(configPath)) {
  try {
    config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } catch (err) {
    logger.error(`Error reading config.json: ${err.message}`);
  }
}

// 3. Initialize Global State
initGlobal(config);

// 4. Initialize Discord Client
const client = new Client({
  checkUpdate: false,
  partials: ["MESSAGE", "CHANNEL", "REACTION"]
});

// 5. Load Commands & Events
loadAllCommands();
loadAllEvents(client);

// 6. Bind Dispatchers
client.on("messageCreate", async (message) => {
  try {
    await handleMessage(client, message);
  } catch (err) {
    logger.error(`Dispatcher Error in messageCreate: ${err.message}`);
  }
});

client.on("messageReactionAdd", async (reaction, user) => {
  try {
    await handleReaction(client, reaction, user);
  } catch (err) {
    logger.error(`Dispatcher Error in messageReactionAdd: ${err.message}`);
  }
});

// 7. Process Safety
process.on("unhandledRejection", (reason) => {
  logger.error(`Unhandled Rejection: ${reason?.message || reason}`);
});

process.on("uncaughtException", (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
});

// 8. Start & Login
const token = process.env.DISCORD_TOKEN || config.token;
if (!token || token === "your_user_token_here") {
  logger.warn("No valid user token found in .env or config.json!");
  logger.info("Please set DISCORD_TOKEN in .env or \"token\" in config.json before starting.");
} else {
  logger.info("Connecting to Discord Gateway with user token...");
  client.login(token).catch((err) => {
    logger.error(`Login failed: ${err.message}`);
  });
}

module.exports = { client };
