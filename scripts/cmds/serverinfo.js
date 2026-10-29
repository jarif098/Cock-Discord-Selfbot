/**
 * JARiF Command: serverinfo
 */

const { boxText } = require("../../core/utils");

module.exports = {
  config: {
    name: "serverinfo",
    version: "1.0.0",
    author: "JARiF",
    role: 0,
    cooldown: 5,
    description: "Displays detailed server metrics and stats",
    usages: "",
    category: "Utility",
    aliases: ["si", "guildinfo"],
    hasPrefix: true
  },

  onStart: async function({ message, reply }) {
    const guild = message.guild;
    if (!guild) {
      return reply("⚠️ This command can only be used inside a Discord server.");
    }

    const created = `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`;
    const channels = guild.channels.cache;
    const textCount = channels.filter(c => c.type === "GUILD_TEXT").size;
    const voiceCount = channels.filter(c => c.type === "GUILD_VOICE").size;

    const details = [
      `• Name: **${guild.name}**`,
      `• Guild ID: \`${guild.id}\``,
      `• Owner: <@${guild.ownerId}> (\`${guild.ownerId}\`)`,
      `• Created: ${created}`,
      `• Members: **${guild.memberCount}**`,
      `• Channels: **${channels.size}** (Text: ${textCount} | Voice: ${voiceCount})`,
      `• Roles: **${guild.roles.cache.size}**`,
      `• Boost Tier: **Tier ${guild.premiumTier}** (${guild.premiumSubscriptionCount || 0} boosts)`
    ].join("\n");

    return reply(boxText(`SERVER: ${guild.name}`, details));
  }
};
