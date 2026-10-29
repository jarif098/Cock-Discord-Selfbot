/**
 * JARiF Command: quote
 */

const { boxText } = require("../../core/utils");

module.exports = {
  config: {
    name: "quote",
    version: "1.0.0",
    author: "JARiF",
    role: 0,
    cooldown: 3,
    description: "Quotes a message by ID or creates an aesthetic quote block",
    usages: "<message_id | text>",
    category: "Fun",
    aliases: ["q"],
    hasPrefix: true
  },

  onStart: async function({ message, args, reply }) {
    if (!args.length) {
      return reply("⚠️ Please provide a message ID to quote, or text to format.");
    }

    const firstArg = args[0];

    // Check if first arg is a Discord Snowflake (message ID)
    if (/^\d{17,20}$/.test(firstArg)) {
      try {
        const fetched = await message.channel.messages.fetch(firstArg);
        if (fetched) {
          const body = [
            `> "${fetched.content}"`,
            `— **${fetched.author.tag}** (<t:${Math.floor(fetched.createdTimestamp / 1000)}:R>)`
          ].join("\n");
          return reply(body);
        }
      } catch (_) {}
    }

    // Custom quote
    const quoteText = args.join(" ");
    const formatted = `> *"${quoteText}"*\n— **${message.author.username}**`;
    return reply(formatted);
  }
};
