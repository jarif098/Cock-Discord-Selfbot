/**
 * COCK Command: stream
 * Streams video via Go Live screenshare into a Discord voice channel
 */

const { boxText } = require("../../core/utils");
const streamController = require("../../core/streamer");

module.exports = {
  config: {
    name: "stream",
    version: "1.0.0",
    author: "JARiF",
    role: 0,
    cooldown: 5,
    description: "Screenshares/streams a YouTube video, direct MP4, or web stream directly into your voice channel",
    usages: "<video_url | YouTube query | direct_mp4>",
    category: "Music",
    aliases: ["screenshare", "golive", "vs", "videostream"],
    hasPrefix: true
  },

  onStart: async function({ client, message, args, prefix, reply }) {
    if (!message.guild) {
      return reply("⚠️ This command can only be used in a Discord server.");
    }

    if (!args.length) {
      const guide = [
        `• Usage: \`${prefix}stream <YouTube URL or search query>\``,
        `• Direct link: \`${prefix}stream https://example.com/movie.mp4\``,
        `• Stop stream: \`${prefix}stopstream\``
      ].join("\n");
      return reply(boxText("SCREENSHARE GUIDE", guide));
    }

    // 1. Identify target voice channel (supports VC text chat or user's active VC)
    let targetChannel = null;
    if (
      message.channel.type === "GUILD_VOICE" ||
      message.channel.type === "GUILD_STAGE_VOICE" ||
      (typeof message.channel.isVoice === "function" && message.channel.isVoice())
    ) {
      targetChannel = message.channel;
    }

    if (!targetChannel) {
      targetChannel = message.member?.voice?.channel;
    }

    if (!targetChannel) {
      return reply("⚠️ Please join a voice channel or run this command inside a voice channel's chat!");
    }

    const query = args.join(" ").trim();
    const waitMsg = await reply("📺 Initializing Go Live screenshare stream, please wait...");

    try {
      const source = await streamController.startScreenShare({
        client,
        guildId: message.guild.id,
        channelId: targetChannel.id,
        query,
        textChannel: message.channel,
        resolution: 720,
        fps: 30
      });

      const details = [
        `• Title: **${source.title}**`,
        `• Channel: **${targetChannel.name}**`,
        `• Mode: 🔴 **Go Live (Screenshare)**`,
        `• Quality: **720p @ 30 FPS**`,
        `• Source: [Link](${source.url})`,
        `• Requested By: **${message.author.username}**`,
        `\n💡 *Join the voice channel and click "Watch Stream" to view!*`
      ].join("\n");

      await waitMsg.edit(boxText("SCREENSHARE LIVE", details));
    } catch (err) {
      await waitMsg.edit(`❌ Failed to start screenshare stream: \`${err.message}\``);
    }
  }
};
