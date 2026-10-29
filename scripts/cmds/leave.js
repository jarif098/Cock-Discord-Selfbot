/**
 * JARiF Command: leave
 * Disconnects the selfbot from the voice channel
 */

module.exports = {
  config: {
    name: "leave",
    version: "1.0.0",
    author: "JARiF",
    role: 0,
    cooldown: 3,
    description: "Leaves the current voice channel and clears the queue",
    usages: "",
    category: "Voice",
    aliases: ["dc", "disconnect", "vcleave"],
    hasPrefix: true
  },

  onStart: async function({ message, reply, voice }) {
    if (!message.guild) {
      return reply("⚠️ This command can only be used in a Discord server.");
    }

    const status = voice.getVoiceStatus(message.guild.id);
    if (!status.isConnected) {
      return reply("⚠️ The selfbot is not currently connected to any voice channel in this server.");
    }

    voice.leaveChannel(message.guild.id);
    return reply("👋 Disconnected from voice channel and cleared audio playback.");
  }
};
