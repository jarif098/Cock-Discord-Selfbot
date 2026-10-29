/**
 * JARiF Command: queue
 * Shows currently playing song and upcoming tracks
 */

const { boxText } = require("../../core/utils");

module.exports = {
  config: {
    name: "queue",
    version: "1.0.0",
    author: "JARiF",
    role: 0,
    cooldown: 3,
    description: "Displays current playing song and queue list",
    usages: "",
    category: "Music",
    aliases: ["qlist", "np"],
    hasPrefix: true
  },

  onStart: async function({ message, reply, voice }) {
    if (!message.guild) {
      return reply("⚠️ This command can only be used in a Discord server.");
    }

    const status = voice.getVoiceStatus(message.guild.id);
    if (!status.isConnected) {
      return reply("⚠️ Not connected to any voice channel.");
    }

    const current = status.currentTrack;
    if (!current) {
      return reply("🔇 No music is currently playing.");
    }

    let text = `▶️ **Now Playing:**\n**${current.title}** (${current.duration}) — *Requested by ${current.requestedBy}*\n\n`;

    if (status.queue.length > 0) {
      text += `📋 **Upcoming Queue (${status.queue.length} track${status.queue.length > 1 ? "s" : ""}):**\n`;
      status.queue.slice(0, 10).forEach((t, i) => {
        text += `${i + 1}. **${t.title}** (\`${t.duration}\`)\n`;
      });
      if (status.queue.length > 10) {
        text += `*...and ${status.queue.length - 10} more tracks.*`;
      }
    } else {
      text += "📋 *Queue is empty.*";
    }

    return reply(boxText("MUSIC QUEUE", text));
  }
};
