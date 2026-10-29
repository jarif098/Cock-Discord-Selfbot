/**
 * JARiF Command: help
 * Paginated and interactive help guide with onReply support
 */

const { boxText } = require("../../core/utils");

module.exports = {
  config: {
    name: "help",
    version: "1.0.0",
    author: "JARiF",
    role: 0,
    cooldown: 3,
    description: "Displays available commands or detailed info on a specific command",
    usages: "[command_name | page_number]",
    category: "General",
    aliases: ["h", "cmds", "menu"],
    hasPrefix: true
  },

  onStart: async function({ message, args, prefix, reply, setReply }) {
    const commands = global.JARiF.commands;
    const arg = args[0]?.toLowerCase();

    // If asking about a specific command
    if (arg && isNaN(arg)) {
      const targetName = global.JARiF.aliases.get(arg) || arg;
      const cmd = commands.get(targetName);

      if (!cmd || !cmd.config) {
        return reply(`❌ Command \`${arg}\` not found in COCK database.`);
      }

      const cfg = cmd.config;
      const details = [
        `• Name: **${cfg.name}**`,
        `• Category: **${cfg.category || "General"}**`,
        `• Role: **${cfg.role === 2 ? "Owner" : cfg.role === 1 ? "Admin" : "Everyone"}**`,
        `• Cooldown: **${cfg.cooldown || 0}s**`,
        `• Aliases: ${cfg.aliases?.length ? cfg.aliases.map(a => `\`${a}\``).join(", ") : "None"}`,
        `• Prefix Required: **${cfg.hasPrefix !== false ? "Yes" : "No"}**`,
        `• Description: ${cfg.description || "No description provided."}`,
        `• Usage: \`${prefix}${cfg.name} ${cfg.usages || ""}\``
      ].join("\n");

      return reply(boxText(`COMMAND: ${cfg.name}`, details));
    }

    // Categorize commands
    const categories = new Map();
    for (const [name, cmd] of commands.entries()) {
      const cat = cmd.config?.category || "General";
      if (!categories.has(cat)) categories.set(cat, []);
      categories.get(cat).push(name);
    }

    const catList = Array.from(categories.keys());
    const itemsPerPage = 3;
    const totalPages = Math.ceil(catList.length / itemsPerPage) || 1;
    let page = parseInt(arg, 10);
    if (isNaN(page) || page < 1 || page > totalPages) page = 1;

    const currentCats = catList.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    let output = `⚡ **COCK Commands Menu** (Page ${page}/${totalPages})\n`;
    output += `Prefix: \`${prefix}\` | Total Commands: **${commands.size}**\n\n`;

    for (const cat of currentCats) {
      const cmdNames = categories.get(cat).sort();
      output += `**[ ${cat.toUpperCase()} ]**\n`;
      output += `${cmdNames.map(c => `\`${prefix}${c}\``).join(" • ")}\n\n`;
    }

    output += `💡 *Reply with a command name (e.g. \`ping\`) or page number (e.g. \`2\`) to view more!*`;

    const sent = await reply(output);
    setReply(sent, { page, totalPages, categories: Array.from(categories.entries()) });
  },

  onReply: async function({ message, Reply, prefix, reply, setReply }) {
    const input = message.content.trim().toLowerCase();
    const targetName = global.JARiF.aliases.get(input) || input;
    const cmd = global.JARiF.commands.get(targetName);

    if (cmd && cmd.config) {
      const cfg = cmd.config;
      const details = [
        `• Name: **${cfg.name}**`,
        `• Category: **${cfg.category || "General"}**`,
        `• Role: **${cfg.role === 2 ? "Owner" : cfg.role === 1 ? "Admin" : "Everyone"}**`,
        `• Cooldown: **${cfg.cooldown || 0}s**`,
        `• Aliases: ${cfg.aliases?.length ? cfg.aliases.map(a => `\`${a}\``).join(", ") : "None"}`,
        `• Prefix: **${cfg.hasPrefix !== false ? "Yes" : "No"}**`,
        `• Description: ${cfg.description || "No description."}`,
        `• Usage: \`${prefix}${cfg.name} ${cfg.usages || ""}\``
      ].join("\n");

      return reply(boxText(`COMMAND: ${cfg.name}`, details));
    }

    const pageNum = parseInt(input, 10);
    if (!isNaN(pageNum)) {
      const commands = global.JARiF.commands;
      const catList = Reply.categories.map(([c]) => c);
      const itemsPerPage = 3;
      const totalPages = Math.ceil(catList.length / itemsPerPage) || 1;

      if (pageNum < 1 || pageNum > totalPages) {
        return reply(`⚠️ Invalid page number. Enter a number between 1 and ${totalPages}.`);
      }

      const currentCats = catList.slice((pageNum - 1) * itemsPerPage, pageNum * itemsPerPage);

      let output = `⚡ **COCK Commands Menu** (Page ${pageNum}/${totalPages})\n`;
      output += `Prefix: \`${prefix}\` | Total Commands: **${commands.size}**\n\n`;

      for (const cat of currentCats) {
        const found = Reply.categories.find(([c]) => c === cat);
        const cmdNames = (found ? found[1] : []).sort();
        output += `**[ ${cat.toUpperCase()} ]**\n`;
        output += `${cmdNames.map(c => `\`${prefix}${c}\``).join(" • ")}\n\n`;
      }

      output += `💡 *Reply with a command name or page number to continue!*`;
      const sent = await reply(output);
      setReply(sent, { page: pageNum, totalPages, categories: Reply.categories });
    }
  }
};
