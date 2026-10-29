/**
 * JARiF Command: info
 */

const os = require("os");
const { boxText, formatUptime, formatBytes } = require("../../core/utils");

module.exports = {
  config: {
    name: "info",
    version: "1.0.0",
    author: "JARiF",
    role: 0,
    cooldown: 5,
    description: "Displays system and selfbot information",
    usages: "",
    category: "General",
    aliases: ["botinfo", "system", "stats"],
    hasPrefix: true
  },

  onStart: async function({ client, reply }) {
    const uptime = formatUptime(Date.now() - (global.JARiF.startTime || Date.now()));
    const memUsed = process.memoryUsage().heapUsed;
    const memTotal = os.totalmem();
    const cmdCount = global.JARiF.commands.size;
    const eventCount = global.JARiF.events.size;
    const serversCount = client.guilds.cache.size;
    const dmsCount = client.channels.cache.filter(c => c.type === "DM" || c.type === "GROUP_DM").size;

    const content = [
      `• User: **${client.user.tag}** (\`${client.user.id}\`)`,
      `• Platform: **${os.type()} (${os.arch()})**`,
      `• Node.js: **${process.version}**`,
      `• Memory: **${formatBytes(memUsed)}** / ${formatBytes(memTotal)}`,
      `• Uptime: **${uptime}**`,
      `• Commands: **${cmdCount}** loaded`,
      `• Events: **${eventCount}** active`,
      `• Guilds: **${serversCount}** | Direct Chats: **${dmsCount}**`,
      `• Architecture: **COCK Modular Architecture**`
    ].join("\n");

    return reply(boxText("COCK SYSTEM INFO", content));
  }
};
