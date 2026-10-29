/**
 * JARiF Command: stop
 */

module.exports = {
  config: {
    name: "stop",
    version: "1.0.0",
    author: "JARiF",
    role: 0,
    cooldown: 2,
    description: "Stops playback and clears the queue",
    usages: "",
    category: "Music",
    aliases: ["halt"],
    hasPrefix: true
  },

  onStart: async function({ message, reply, voice }) {
    if (!message.guild) return reply("⚠️ Server only command.");

    voice.stopPlayback(message.guild.id);
    return reply("⏹️ Stopped playback and cleared the song queue.");
  }
};
