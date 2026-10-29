/**
 * JARiF Command: play
 * Plays audio in the Discord voice channel from YouTube search or URL
 */

const { boxText } = require("../../core/utils");
const ymcdn = require("../../helpers/ymcdn");

module.exports = {
  config: {
    name: "play",
    version: "1.0.0",
    author: "JARiF",
    role: 0,
    cooldown: 3,
    description: "Plays a song or YouTube URL in your current voice channel",
    usages: "<song name | YouTube URL>",
    category: "Music",
    aliases: ["p", "music"],
    hasPrefix: true
  },

  onStart: async function({ message, args, prefix, reply, voice }) {
    if (!message.guild) {
      return reply("⚠️ This command can only be used in a Discord server.");
    }

    if (!args.length) {
      return reply(`🎵 Please provide a song name or YouTube link!\nExample: \`${prefix}play cupid fifty fifty\``);
    }

    // 1. Identify voice channel:
    // Check if the command was sent directly in a voice channel's chat
    let targetChannel = null;
    if (
      message.channel.type === "GUILD_VOICE" ||
      message.channel.type === "GUILD_STAGE_VOICE" ||
      (typeof message.channel.isVoice === "function" && message.channel.isVoice())
    ) {
      targetChannel = message.channel;
    }

    // Otherwise check if author is in a voice channel in this server
    if (!targetChannel) {
      targetChannel = message.member?.voice?.channel;
    }

    const currentVoice = voice.getVoiceStatus(message.guild.id);

    if (!currentVoice.isConnected && !targetChannel) {
      return reply("⚠️ Please join a voice channel or use this command inside a voice channel chat!");
    }

    const query = args.join(" ").trim();
    const waitMsg = await reply("🔍 Searching and buffering audio track, please wait...");

    try {
      // 2. Fetch song details via ymcdn helper
      const songData = await ymcdn.scrape(query, { type: "mp3" });
      if (!songData || !songData.download_url) {
        throw new Error("Could not obtain audio stream from YMCDN scraper.");
      }

      // 3. Connect to VC if not yet connected
      if (!currentVoice.isConnected && targetChannel) {
        await voice.joinChannel({ channel: targetChannel });
      }

      // 4. Enqueue or play track
      const result = await voice.enqueueTrack({
        guildId: message.guild.id,
        channel: targetChannel,
        textChannel: message.channel,
        track: {
          title: songData.title,
          author: songData.author,
          duration: songData.duration,
          url: songData.url,
          download_url: songData.download_url,
          streamUrl: songData.streamUrl,
          requestedBy: message.author.tag
        }
      });

      const details = [
        `• Title: **${songData.title}**`,
        `• Artist: **${songData.author}**`,
        `• Duration: **${songData.duration}**`,
        `• Link: [YouTube](${songData.url})`,
        `• Requested By: **${message.author.username}**`
      ];

      if (result.enqueued) {
        details.push(`• Status: 📋 **Added to Queue (Position #${result.position})**`);
        await waitMsg.edit(boxText("ENQUEUED TRACK", details.join("\n")));
      } else {
        details.push(`• Status: ▶️ **Now Playing in Voice Channel**`);
        await waitMsg.edit(boxText("NOW PLAYING", details.join("\n")));
      }

    } catch (err) {
      await waitMsg.edit(`❌ Error loading song: \`${err.message}\``);
    }
  }
};
