/**
 * JARiF Command Example Template
 * Rename or copy this file (e.g., mycommand.js) in scripts/cmds/
 */

module.exports = {
  config: {
    name: "example",
    version: "1.0.0",
    author: "JARiF",
    role: 0, // 0: Everyone (or Self if selfbotOnly: true), 1: Guild Admin, 2: Bot Owner/Self only
    cooldown: 5, // Cooldown in seconds
    description: "An example command demonstrating JARiF lifecycle hooks",
    usages: "[optional argument]",
    category: "General",
    aliases: ["ex", "sample"],
    hasPrefix: true // Set to false if command can be run without prefix
  },

  // Called when command is invoked
  onStart: async function({ client, message, args, commandName, prefix, selfBot, reply, setReply, setReaction }) {
    const sent = await reply(`Hello from **${commandName}**! Reply to this message to trigger onReply!`);
    
    // Register reply context for interactive multi-turn dialogue
    setReply(sent, { step: 1, originalAuthor: message.author.id });
  },

  // Called whenever ANY message is sent (useful for auto-responders, keyword filters, AFK alerts)
  onChat: async function({ client, message, prefix, config, isSelf, isAdmin, reply }) {
    // Example: If message contains 'goat'
    // if (message.content.toLowerCase().includes("goat")) { ... }
  },

  // Called when a user replies to a message sent by this command that was registered with setReply
  onReply: async function({ client, message, event, Reply, args, prefix, reply, setReply }) {
    await reply(`🔄 You replied: "${message.content}" (Saved step was: ${Reply.step})`);
  },

  // Called when a user reacts to a message registered with setReaction
  onReaction: async function({ client, reaction, user, reactionData, isSelf, isAdmin }) {
    // Handle reactions
  }
};
