/**
 * JARiF Command: status
 * Updates Discord presence status and rich activity
 */

const { boxText } = require("../../core/utils");

module.exports = {
  config: {
    name: "status",
    version: "1.0.0",
    author: "JARiF",
    role: 2, // Owner only
    cooldown: 5,
    description: "Updates selfbot presence status and activity",
    usages: "<online|idle|dnd|invisible> [PLAYING|STREAMING|LISTENING|WATCHING] [text]",
    category: "Selfbot",
    aliases: ["setstatus", "presence"],
    hasPrefix: true
  },

  onStart: async function({ client, args, prefix, reply }) {
    const validStatus = ["online", "idle", "dnd", "invisible"];
    const validTypes = ["PLAYING", "STREAMING", "LISTENING", "WATCHING", "COMPETING"];

    if (!args.length) {
      const guide = [
        `• Status options: \`${validStatus.join(" | ")}\``,
        `• Activity types: \`${validTypes.join(" | ")}\``,
        `• Example: \`${prefix}status online PLAYING Grand Theft Auto VI\``,
        `• Example: \`${prefix}status dnd STREAMING Coding JARiF\``
      ].join("\n");
      return reply(boxText("STATUS CONFIG", guide));
    }

    const presence = args[0].toLowerCase();
    if (!validStatus.includes(presence)) {
      return reply(`⚠️ Invalid status. Choose from: \`${validStatus.join(", ")}\``);
    }

    const typeArg = args[1]?.toUpperCase();
    if (typeArg && validTypes.includes(typeArg)) {
      const text = args.slice(2).join(" ").trim() || "JARiF SelfBot";
      client.user.setPresence({
        status: presence,
        activities: [{
          name: text,
          type: typeArg,
          url: typeArg === "STREAMING" ? "https://twitch.tv/discord" : undefined
        }]
      });
      return reply(`✅ Presence set to **${presence.toUpperCase()}** | **${typeArg}** \`${text}\``);
    } else {
      client.user.setPresence({ status: presence });
      return reply(`✅ Presence set to **${presence.toUpperCase()}**`);
    }
  }
};
