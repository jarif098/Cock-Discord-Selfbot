/**
 * JARiF Command: snipe
 * Retrieves the last deleted message in the channel
 */

const { boxText, formatUptime } = require("../../core/utils");

module.exports = {
  config: {
    name: "snipe",
    version: "1.0.0",
    author: "JARiF",
    role: 0,
    cooldown: 5,
    description: "Snipes the last deleted message in this channel",
    usages: "",
    category: "Utility",
    aliases: ["s"],
    hasPrefix: true
  },

  onStart: async function({ message, reply }) {
    const sniped = global.JARiF.snipe.get(message.channel.id);
    if (!sniped) {
      return reply("🎯 There are no recently deleted messages recorded in this channel.");
    }

    const timeAgo = formatUptime(Date.now() - sniped.timestamp);
    const content = [
      `• Author: **${sniped.author.tag}** (\`${sniped.author.id || "Unknown"}\`)`,
      `• Deleted: **${timeAgo} ago**`,
      `• Content:\n> ${sniped.content.replace(/\n/g, "\n> ")}`
    ];

    if (sniped.attachments?.length > 0) {
      content.push(`• Attachments: ${sniped.attachments.join(", ")}`);
    }

    return reply(boxText("SNIPED MESSAGE", content.join("\n")));
  }
};
