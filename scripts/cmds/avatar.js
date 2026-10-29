/**
 * JARiF Command: avatar
 */

const { boxText } = require("../../core/utils");

module.exports = {
  config: {
    name: "avatar",
    version: "1.0.0",
    author: "JARiF",
    role: 0,
    cooldown: 5,
    description: "Fetches user avatar in high resolution",
    usages: "[@mention | user_id]",
    category: "Utility",
    aliases: ["av", "pfp"],
    hasPrefix: true
  },

  onStart: async function({ client, message, args, reply }) {
    let target = message.mentions.users.first();

    if (!target && args[0]) {
      try {
        target = await client.users.fetch(args[0]);
      } catch (_) {}
    }

    if (!target) {
      target = message.author;
    }

    const png = target.displayAvatarURL({ format: "png", size: 4096 });
    const webp = target.displayAvatarURL({ format: "webp", size: 4096 });
    const gif = target.displayAvatarURL({ dynamic: true, size: 4096 });

    const info = [
      `User: **${target.tag}** (\`${target.id}\`)`,
      `Formats: [PNG](${png}) • [WEBP](${webp}) • [GIF/Dynamic](${gif})`,
      gif
    ].join("\n");

    return reply(boxText("USER AVATAR", info));
  }
};
