/**
 * JARiF Event: messageDelete
 * Caches recently deleted messages for the snipe command
 */

module.exports = {
  config: {
    name: "messageDelete",
    version: "1.0.0",
    author: "JARiF",
    description: "Caches the last deleted message per channel for the snipe command"
  },

  onStart: async function({ args }) {
    const message = args[0];
    if (!message || !message.channel || message.partial) return;

    // Cache deleted message
    global.JARiF.snipe.set(message.channel.id, {
      content: message.content || "*No text content*",
      author: message.author ? {
        id: message.author.id,
        tag: message.author.tag,
        avatar: message.author.displayAvatarURL({ dynamic: true })
      } : { tag: "Unknown" },
      attachments: message.attachments.map(att => att.url),
      timestamp: Date.now()
    });
  }
};
