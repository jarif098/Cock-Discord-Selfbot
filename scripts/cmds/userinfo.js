/**
 * JARiF Command: userinfo
 */

const { boxText } = require("../../core/utils");

module.exports = {
  config: {
    name: "userinfo",
    version: "1.0.0",
    author: "JARiF",
    role: 0,
    cooldown: 5,
    description: "Displays detailed account info of a user",
    usages: "[@mention | user_id]",
    category: "Utility",
    aliases: ["whois", "ui"],
    hasPrefix: true
  },

  onStart: async function({ client, message, args, reply }) {
    let target = message.mentions.users.first();

    if (!target && args[0]) {
      try {
        target = await client.users.fetch(args[0]);
      } catch (_) {}
    }

    if (!target) target = message.author;

    let member = null;
    if (message.guild) {
      try {
        member = await message.guild.members.fetch(target.id);
      } catch (_) {}
    }

    const created = `<t:${Math.floor(target.createdTimestamp / 1000)}:R>`;
    const joined = member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : "N/A (Not in guild)";

    const details = [
      `• Tag: **${target.tag}**`,
      `• ID: \`${target.id}\``,
      `• Account Type: **${target.bot ? "Bot" : "User"}**`,
      `• Created: ${created}`,
      `• Joined Server: ${joined}`,
      `• Avatar: [Link](${target.displayAvatarURL({ dynamic: true, size: 2048 })})`
    ];

    if (member) {
      const roles = member.roles.cache
        .filter(r => r.id !== message.guild.id)
        .map(r => r.name);
      details.push(`• Roles [${roles.length}]: ${roles.slice(0, 10).join(", ") || "None"}${roles.length > 10 ? "..." : ""}`);
    }

    return reply(boxText(`USER: ${target.username}`, details.join("\n")));
  }
};
