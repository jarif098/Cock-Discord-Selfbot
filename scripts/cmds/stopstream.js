/**
 * COCK Command: stopstream
 * Stops active Go Live screenshare stream
 */

const streamController = require("../../core/streamer");

module.exports = {
  config: {
    name: "stopstream",
    version: "1.0.0",
    author: "JARiF",
    role: 0,
    cooldown: 2,
    description: "Stops active Go Live screenshare in the current server",
    usages: "",
    category: "Music",
    aliases: ["endstream", "leaveshare"],
    hasPrefix: true
  },

  onStart: async function({ message, reply }) {
    if (!message.guild) {
      return reply("⚠️ This command can only be used in a Discord server.");
    }

    const status = streamController.getScreenShareStatus(message.guild.id);
    if (!status.isStreaming) {
      return reply("⚠️ No screenshare stream is currently active in this server.");
    }

    await streamController.stopScreenShare(message.guild.id);
    return reply("🛑 Stopped screenshare stream and ended Go Live broadcast.");
  }
};
