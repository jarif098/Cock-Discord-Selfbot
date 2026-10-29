/**
 * JARiF Command: purge
 * Deletes the user's own sent messages in the current channel
 */

const { sleep } = require("../../core/utils");

module.exports = {
  config: {
    name: "purge",
    version: "1.0.0",
    author: "JARiF",
    role: 2, // Owner / Self only
    cooldown: 5,
    description: "Clears your recently sent messages in this channel",
    usages: "<amount>",
    category: "Selfbot",
    aliases: ["clear", "clean", "prune"],
    hasPrefix: true
  },

  onStart: async function({ client, message, args, reply }) {
    const amount = parseInt(args[0], 10);
    if (isNaN(amount) || amount <= 0) {
      return reply("⚠️ Please specify a valid number of messages to purge (e.g. `.purge 10`).");
    }

    const limit = Math.min(amount, 100);

    // Delete the trigger message if possible
    try {
      if (message.deletable) await message.delete();
    } catch (_) {}

    try {
      const fetched = await message.channel.messages.fetch({ limit: 100 });
      const userMessages = fetched.filter(m => m.author.id === client.user.id).first(limit);

      let deletedCount = 0;
      for (const msg of userMessages) {
        try {
          await msg.delete();
          deletedCount++;
          await sleep(650); // Safe delay to prevent rate limits
        } catch (_) {}
      }

      const statusMsg = await message.channel.send(`🧹 Successfully purged **${deletedCount}** message(s).`);
      setTimeout(() => {
        statusMsg.delete().catch(() => {});
      }, 3000);
    } catch (err) {
      reply(`❌ Error purging messages: \`${err.message}\``);
    }
  }
};
