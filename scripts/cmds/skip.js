/**
 * JARiF Command: skip
 */

module.exports = {
  config: {
    name: "skip",
    version: "1.0.0",
    author: "JARiF",
    role: 0,
    cooldown: 2,
    description: "Skips the current song in voice playback",
    usages: "",
    category: "Music",
    aliases: ["next"],
    hasPrefix: true
  },

  onStart: async function({ message, reply, voice }) {
    if (!message.guild) return reply("⚠️ Server only command.");

    const status = voice.getVoiceStatus(message.guild.id);
    if (!status.isConnected || !status.currentTrack) {
      return reply("🔇 No song is currently playing to skip.");
    }

    voice.skipTrack(message.guild.id);
    return reply("⏭️ Skipped current track.");
  }
};
