/**
 * JARiF Event: Ready
 */

const logger = require("../../core/logger");

module.exports = {
  config: {
    name: "ready",
    version: "1.0.0",
    author: "JARiF",
    description: "Triggers when the selfbot successfully authenticates with Discord"
  },

  onStart: async function({ client }) {
    logger.success(`Logged in as: ${client.user.tag} (${client.user.id})`, "GATEWAY");
    logger.info(`Servers: ${client.guilds.cache.size} | Friends/DMs: ${client.channels.cache.size}`);
    logger.info(`Prefix: "${global.JARiF.config.prefix || "."}" | Selfbot-Only: ${global.JARiF.config.selfbotOnly ? "Enabled" : "Disabled"}`);

    // Set custom rich presence if defined
    const statusCfg = global.JARiF.config.status;
    if (statusCfg) {
      try {
        const presence = statusCfg.presence || "online";
        const activity = statusCfg.activity;
        if (activity && activity.name) {
          client.user.setPresence({
            status: presence,
            activities: [{
              name: activity.name,
              type: activity.type || "PLAYING",
              url: activity.url
            }]
          });
        } else {
          client.user.setPresence({ status: presence });
        }
        logger.info(`Status applied: ${presence.toUpperCase()}`);
      } catch (err) {
        logger.warn(`Could not set presence: ${err.message}`);
      }
    }

    logger.cock("System is ready and listening for commands!");
  }
};
