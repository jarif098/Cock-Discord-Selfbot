/**
 * JARiF Command: afk
 * Intelligent AFK system using onStart and onChat
 */

const { formatUptime } = require("../../core/utils");

module.exports = {
  config: {
    name: "afk",
    version: "1.0.0",
    author: "JARiF",
    role: 0,
    cooldown: 5,
    description: "Sets your status to Away From Keyboard with a custom reason",
    usages: "[reason]",
    category: "Utility",
    aliases: ["away"],
    hasPrefix: true
  },

  onStart: async function({ message, args, reply }) {
    const reason = args.join(" ").trim() || "Away from keyboard";
    global.JARiF.afk.set(message.author.id, {
      reason,
      timestamp: Date.now()
    });

    return reply(`💤 You are now AFK: **${reason}**`);
  },

  onChat: async function({ message, reply }) {
    if (!message.author || message.author.bot) return;

    // 1. Check if the author was AFK and has returned
    if (global.JARiF.afk.has(message.author.id)) {
      const data = global.JARiF.afk.get(message.author.id);
      // Ensure this isn't the trigger message that just set AFK
      if (Date.now() - data.timestamp > 3000) {
        const duration = formatUptime(Date.now() - data.timestamp);
        global.JARiF.afk.delete(message.author.id);
        reply(`👋 Welcome back **${message.author.username}**! You were AFK for **${duration}**.`);
      }
    }

    // 2. Check if a mentioned user is AFK
    if (message.mentions && message.mentions.users.size > 0) {
      for (const [userId, user] of message.mentions.users.entries()) {
        if (userId !== message.author.id && global.JARiF.afk.has(userId)) {
          const afkInfo = global.JARiF.afk.get(userId);
          const timeAgo = formatUptime(Date.now() - afkInfo.timestamp);
          reply(`💤 **${user.username}** is currently AFK: *${afkInfo.reason}* (${timeAgo} ago)`);
        }
      }
    }
  }
};
