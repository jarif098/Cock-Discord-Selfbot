/**
 * JARiF Command: cmd
 * JARiF internal command manager (reload, load, unload, list)
 */

const fs = require("fs");
const path = require("path");
const { boxText } = require("../../core/utils");
const { reloadCommand, loadCommandFile } = require("../../core/loader");

module.exports = {
  config: {
    name: "cmd",
    version: "1.0.0",
    author: "JARiF",
    role: 2, // Owner only
    cooldown: 2,
    description: "Manage, reload, and inspect JARiF command scripts dynamically",
    usages: "<reload | load | unload | list> [command_name]",
    category: "Admin",
    aliases: ["command", "modules"],
    hasPrefix: true
  },

  onStart: async function({ message, args, prefix, reply }) {
    const action = args[0]?.toLowerCase();
    const targetName = args[1]?.toLowerCase();
    const cmdsDir = path.join(__dirname);

    if (!action) {
      const guide = [
        `• \`${prefix}cmd reload <name>\` - Reload an existing command`,
        `• \`${prefix}cmd load <fileName>\` - Load a new command file`,
        `• \`${prefix}cmd unload <name>\` - Unload a command from memory`,
        `• \`${prefix}cmd list\` - List all files in scripts/cmds/`
      ].join("\n");
      return reply(boxText("CMD MANAGER", guide));
    }

    if (action === "reload") {
      if (!targetName) return reply(`⚠️ Please specify the command to reload (e.g., \`${prefix}cmd reload ping\`).`);
      const result = reloadCommand(targetName);
      return reply(result.success ? `✅ ${result.message}` : `❌ ${result.message}`);
    }

    if (action === "load") {
      if (!targetName) return reply(`⚠️ Please specify the file name to load (e.g., \`${prefix}cmd load test.js\`).`);
      const fileName = targetName.endsWith(".js") ? targetName : `${targetName}.js`;
      const fullPath = path.join(cmdsDir, fileName);

      if (!fs.existsSync(fullPath)) {
        return reply(`❌ File \`${fileName}\` does not exist in \`scripts/cmds/\`.`);
      }

      const loaded = loadCommandFile(fullPath);
      if (loaded) {
        return reply(`✅ Command \`${loaded}\` successfully loaded into COCK runtime.`);
      } else {
        return reply(`❌ Failed to load \`${fileName}\`. Check console logs for details.`);
      }
    }

    if (action === "unload") {
      if (!targetName) return reply(`⚠️ Please specify the command to unload.`);
      const realName = global.JARiF.aliases.get(targetName) || targetName;

      if (!global.JARiF.commands.has(realName)) {
        return reply(`❌ Command \`${targetName}\` is not currently loaded.`);
      }

      global.JARiF.commands.delete(realName);
      // Remove aliases
      for (const [alias, cmd] of global.JARiF.aliases.entries()) {
        if (cmd === realName) global.JARiF.aliases.delete(alias);
      }

      return reply(`🗑️ Successfully unloaded command \`${realName}\`.`);
    }

    if (action === "list") {
      const files = fs.readdirSync(cmdsDir).filter(f => f.endsWith(".js"));
      const activeCount = global.JARiF.commands.size;
      const fileList = files.map(f => {
        const isLoaded = global.JARiF.commands.has(f.replace(".js", ""));
        return `${isLoaded ? "🟢" : "⚪"} ${f}`;
      });

      const body = `Files (${files.length}) | Active in memory (${activeCount}):\n` + fileList.join("\n");
      return reply(boxText("COMMAND FILES", body));
    }

    return reply(`⚠️ Unknown action \`${action}\`. Use \`${prefix}cmd\` for help.`);
  }
};
