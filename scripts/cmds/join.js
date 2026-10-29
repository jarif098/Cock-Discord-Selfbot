/**
 * JARiF Command: join
 * Connects the selfbot to a voice channel
 */

const { boxText } = require("../../core/utils");

module.exports = {
  config: {
    name: "join",
    version: "1.0.0",
    author: "JARiF",
    role: 0,
    cooldown: 5,
    description: "Joins your current voice channel or a specified voice channel ID",
    usages: "[voice_channel_id]",
    category: "Voice",
    aliases: ["j", "connect", "vcjoin"],
    hasPrefix: true
  },

  onStart: async function({ client, message, args, reply, voice }) {
    if (!message.guild) {
      return reply("⚠️ This command can only be used in a Discord server.");
    }

    let targetChannel = null;

    // 1. Check if channel ID was provided as argument
    if (args[0] && /^\d{17,20}$/.test(args[0])) {
      try {
        const ch = await message.guild.channels.fetch(args[0]);
        if (ch && (ch.type === "GUILD_VOICE" || ch.type === "GUILD_STAGE_VOICE")) {
          targetChannel = ch;
        }
      } catch (_) {}
    }

    // 2. Check if the command was typed in a voice channel chat
    if (
      !targetChannel &&
      (message.channel.type === "GUILD_VOICE" ||
        message.channel.type === "GUILD_STAGE_VOICE" ||
        (typeof message.channel.isVoice === "function" && message.channel.isVoice()))
    ) {
      targetChannel = message.channel;
    }

    // 3. Check if author is in a voice channel
    if (!targetChannel) {
      targetChannel = message.member?.voice?.channel;
    }

    if (!targetChannel) {
      return reply("⚠️ Please join a voice channel first or provide a valid voice channel ID: `.join <channel_id>`");
    }

    const waitMsg = await reply(`🔊 Connecting to **${targetChannel.name}**...`);

    try {
      await voice.joinChannel({
        channel: targetChannel,
        selfDeaf: false,
        selfMute: false
      });

      const info = [
        `• Connected to: **${targetChannel.name}**`,
        `• Channel ID: \`${targetChannel.id}\``,
        `• Server: **${message.guild.name}**`,
        `• Status: **Ready to play audio** 🎵`
      ].join("\n");

      await waitMsg.edit(boxText("VOICE CONNECTED", info));
    } catch (err) {
      await waitMsg.edit(`❌ Failed to join voice channel: \`${err.message}\``);
    }
  }
};
