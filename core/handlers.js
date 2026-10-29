/**
 * JARiF Dispatch Handlers - messageCreate, messageReactionAdd, onReply, onChat
 */

const logger = require("./logger");

async function handleMessage(client, message) {
  if (!message || message.webhookId) return;

  const config = global.JARiF.config || {};
  const prefix = config.prefix || ".";
  const isSelf = message.author.id === client.user.id;
  const isAdmin = (config.adminBot || []).includes(message.author.id) || isSelf;

  const originalReply = message.reply.bind(message);

  // Enhanced helper reply function with GoatBot attachment & unsend support
  const reply = async (content, options = {}) => {
    let sendPayload = {};
    if (typeof content === "string") {
      sendPayload = { content, ...options };
    } else if (content && typeof content === "object") {
      if (content.body || content.content) sendPayload.content = content.body || content.content;
      if (content.attachment) {
        sendPayload.files = [{
          attachment: content.attachment,
          name: content.name || (content.isAudio ? "song.mp3" : "attachment")
        }];
      }
      sendPayload = { ...sendPayload, ...options };
    }

    let sent;
    try {
      sent = await originalReply(sendPayload);
    } catch (_) {
      try {
        sent = await message.channel.send(sendPayload);
      } catch (e) {
        logger.error(`Failed to send reply: ${e.message}`);
      }
    }

    if (sent) {
      sent.unsend = async () => {
        try { await sent.delete(); } catch (_) {}
      };
    }
    return sent;
  };

  message.reply = async (content, options = {}) => {
    return await reply(content, options);
  };

  const api = {
    sendMessage: (content) => reply(content),
    unsendMessage: async (msgId) => {
      try {
        const target = await message.channel.messages.fetch(msgId);
        if (target) await target.delete();
      } catch (_) {}
    }
  };

  // Helper to attach an onReply handler to a message
  const setReply = (sentMsg, commandName, data = {}) => {
    if (!sentMsg || !sentMsg.id) return;
    global.JARiF.onReply.set(sentMsg.id, {
      commandName: commandName.toLowerCase(),
      authorId: message.author.id,
      data
    });
  };

  // Helper to attach an onReaction handler to a message
  const setReaction = (sentMsg, commandName, data = {}) => {
    if (!sentMsg || !sentMsg.id) return;
    global.JARiF.onReaction.set(sentMsg.id, {
      commandName: commandName.toLowerCase(),
      authorId: message.author.id,
      data
    });
  };

  // 1. Dispatch onChat to all registered commands
  for (const [cmdName, cmd] of global.JARiF.commands.entries()) {
    if (typeof cmd.onChat === "function") {
      try {
        await cmd.onChat({
          client,
          message,
          prefix,
          config,
          isSelf,
          isAdmin,
          reply
        });
      } catch (err) {
        logger.error(`Error in onChat [${cmdName}]: ${err.message}`);
      }
    }
  }

  // 2. Dispatch onReply if this message is replying to a registered message
  if (message.reference && message.reference.messageId) {
    const replyMeta = global.JARiF.onReply.get(message.reference.messageId);
    if (replyMeta) {
      // Permission check for reply
      const isReplyOwner = !replyMeta.authorId || replyMeta.authorId === message.author.id || isAdmin;
      if (isReplyOwner) {
        const cmd = global.JARiF.commands.get(replyMeta.commandName);
        if (cmd && typeof cmd.onReply === "function") {
          try {
            const rawArgs = message.content.trim().split(/\s+/);
            await cmd.onReply({
              client,
              message,
              event: message,
              Reply: replyMeta.data,
              args: rawArgs,
              prefix,
              reply,
              setReply: (msg, data) => setReply(msg, replyMeta.commandName, data)
            });
            return;
          } catch (err) {
            logger.error(`Error in onReply [${replyMeta.commandName}]: ${err.message}`);
            return reply(`❌ Error in reply handler: \`${err.message}\``);
          }
        }
      }
    }
  }

  // 3. Mention-as-prefix & Message Parsing
  let content = message.content.trim();
  const mentionRegex = new RegExp(`^<@!?${client.user.id}>`, "i");
  const isMentioned = mentionRegex.test(content);

  // If the message starts with bot mention (e.g. @Eijah Noah help or @Eijah Noah .help)
  if (isMentioned) {
    content = content.replace(mentionRegex, "").trim();
    // Clean leading dots, newlines, and spaces
    if (content.startsWith(prefix) || /^[.\s\r\n]+/.test(content)) {
      content = content.replace(/^[.\s\r\n]+/, prefix);
    }

    // If it was just a mention with nothing else:
    if (!content) {
      return reply(`🐔 **COCK SelfBot** is active!\n• Prefix: \`${prefix}\`\n• Type \`${prefix}help\` to see all commands.`);
    }
  }

  // Check selfbotOnly authorization
  const selfbotOnly = config.selfbotOnly !== undefined ? config.selfbotOnly : false;
  if (selfbotOnly && !isSelf && !isAdmin) {
    // If user attempted to run a command while selfbotOnly is on, notify in console
    if (content.startsWith(prefix) || isMentioned) {
      logger.warn(`Ignored command attempt from [${message.author.tag}] because selfbotOnly is true.`, "AUTH");
    }
    return;
  }

  let commandQuery = "";
  let args = [];

  if (content.startsWith(prefix)) {
    const slice = content.slice(prefix.length).trim();
    args = slice.split(/\s+/);
    commandQuery = args.shift()?.toLowerCase() || "";
  } else if (isMentioned) {
    // Allows "@Bot help" without prefix
    args = content.split(/\s+/);
    commandQuery = args.shift()?.toLowerCase() || "";
  } else {
    // Check if command hasPrefix: false
    const firstWord = content.split(/\s+/)[0]?.toLowerCase() || "";
    const resolvedName = global.JARiF.aliases.get(firstWord) || firstWord;
    const possibleCmd = global.JARiF.commands.get(resolvedName);
    if (possibleCmd && possibleCmd.config && possibleCmd.config.hasPrefix === false) {
      args = content.split(/\s+/);
      commandQuery = args.shift()?.toLowerCase() || "";
    } else {
      return;
    }
  }

  if (!commandQuery) return;

  const resolvedName = global.JARiF.aliases.get(commandQuery) || commandQuery;
  const command = global.JARiF.commands.get(resolvedName);

  if (!command || !command.config) return;

  // 4. Role Permissions
  // Role 0: Everyone (or Self/Admins in selfbotOnly)
  // Role 1: Guild Administrator or Bot Admin
  // Role 2: Bot Owner only (self or adminBot list)
  const roleRequired = command.config.role || 0;
  if (roleRequired === 1) {
    const isGuildAdmin = message.member?.permissions?.has("ADMINISTRATOR");
    if (!isGuildAdmin && !isAdmin) {
      return reply("⚠️ You need Server Administrator permissions to use this command.");
    }
  } else if (roleRequired === 2) {
    if (!isAdmin) {
      return reply("⛔ This command is restricted to the SelfBot Owner.");
    }
  }

  // 5. Cooldown Check
  const cooldownSec = command.config.cooldown || 0;
  if (cooldownSec > 0 && !isAdmin) {
    const cdKey = `${message.author.id}_${resolvedName}`;
    const lastUsed = global.JARiF.cooldowns.get(cdKey) || 0;
    const now = Date.now();
    const remaining = (lastUsed + cooldownSec * 1000 - now) / 1000;

    if (remaining > 0) {
      return reply(`⏳ Please wait **${remaining.toFixed(1)}s** before using \`${resolvedName}\` again.`);
    }
    global.JARiF.cooldowns.set(cdKey, now);
  }

  // 6. Execute onStart
  if (typeof command.onStart === "function") {
    try {
      logger.cmd(`[${message.author.tag}] executed: ${prefix}${resolvedName} ${args.join(" ")}`);

      // JARiF localization getter
      const getLang = (key, ...replaces) => {
        const userLang = config.language || "en";
        let text = command.langs?.[userLang]?.[key] || command.langs?.en?.[key] || key;
        if (typeof text !== "string") text = String(text);
        text = text.replace(/\{p\}/g, prefix);
        replaces.forEach((val, idx) => {
          text = text.replace(new RegExp(`%${idx + 1}`, "g"), val);
        });
        return text;
      };

      const userRole = isAdmin ? 2 : (message.member?.permissions?.has("ADMINISTRATOR") ? 1 : 0);

      await command.onStart({
        api,
        client,
        message,
        event: message,
        args,
        role: userRole,
        commandName: resolvedName,
        getLang,
        commands: global.JARiF.commands,
        prefix,
        selfBot: client.user,
        utils: global.utils,
        voice: global.JARiF.voice,
        streamController: global.JARiF.streamController,
        reply,
        setReply: (msg, data) => setReply(msg, resolvedName, data),
        setReaction: (msg, data) => setReaction(msg, resolvedName, data)
      });
    } catch (err) {
      logger.error(`Error executing [${resolvedName}]: ${err.stack || err.message}`);
      reply(`❌ Command Error: \`${err.message}\``);
    }
  }
}

async function handleReaction(client, reaction, user) {
  if (user.bot) return;

  const reactionMeta = global.JARiF.onReaction.get(reaction.message.id);
  if (!reactionMeta) return;

  const config = global.JARiF.config || {};
  const isSelf = user.id === client.user.id;
  const isAdmin = (config.adminBot || []).includes(user.id) || isSelf;

  if (reactionMeta.authorId && reactionMeta.authorId !== user.id && !isAdmin) {
    return;
  }

  const cmd = global.JARiF.commands.get(reactionMeta.commandName);
  if (cmd && typeof cmd.onReaction === "function") {
    try {
      await cmd.onReaction({
        client,
        reaction,
        user,
        reactionData: reactionMeta.data,
        isSelf,
        isAdmin
      });
    } catch (err) {
      logger.error(`Error in onReaction [${reactionMeta.commandName}]: ${err.message}`);
    }
  }
}

module.exports = {
  handleMessage,
  handleReaction
};
