/**
 * JARiF Loader - Dynamic loader for commands and events
 */

const fs = require("fs");
const path = require("path");
const logger = require("./logger");

const CMDS_DIR = path.join(__dirname, "..", "scripts", "cmds");
const EVENTS_DIR = path.join(__dirname, "..", "scripts", "events");

function initGlobal(config) {
  if (!global.JARiF) {
    global.JARiF = {
      commands: new Map(),
      aliases: new Map(),
      events: new Map(),
      onReply: new Map(),
      onReaction: new Map(),
      cooldowns: new Map(),
      snipe: new Map(),
      afk: new Map(),
      config: config || {},
      startTime: Date.now()
    };
  }
  global.utils = require("./utils");
  global.JARiF.voice = require("./voice");
  global.GoatBot = global.JARiF;
  global.COCK = global.JARiF;
}

function loadCommandFile(filePath) {
  try {
    delete require.cache[require.resolve(filePath)];
    const cmd = require(filePath);

    if (!cmd || !cmd.config || !cmd.config.name) {
      logger.warn(`Skipped invalid command file: ${path.basename(filePath)}`);
      return false;
    }

    const name = cmd.config.name.toLowerCase();
    global.JARiF.commands.set(name, cmd);

    // Register aliases
    if (Array.isArray(cmd.config.aliases)) {
      for (const alias of cmd.config.aliases) {
        global.JARiF.aliases.set(alias.toLowerCase(), name);
      }
    }

    return name;
  } catch (err) {
    logger.error(`Failed to load command ${path.basename(filePath)}: ${err.message}`);
    return false;
  }
}

function loadAllCommands() {
  if (!fs.existsSync(CMDS_DIR)) {
    fs.mkdirSync(CMDS_DIR, { recursive: true });
  }

  const files = fs.readdirSync(CMDS_DIR).filter(f => f.endsWith(".js") && !f.endsWith(".eg.js") && !f.startsWith("_"));
  let loadedCount = 0;

  for (const file of files) {
    const fullPath = path.join(CMDS_DIR, file);
    const loadedName = loadCommandFile(fullPath);
    if (loadedName) {
      loadedCount++;
    }
  }

  logger.success(`Loaded ${loadedCount} command(s) successfully.`, "LOADER");
  return loadedCount;
}

function loadAllEvents(client) {
  if (!fs.existsSync(EVENTS_DIR)) {
    fs.mkdirSync(EVENTS_DIR, { recursive: true });
  }

  const files = fs.readdirSync(EVENTS_DIR).filter(f => f.endsWith(".js") && !f.startsWith("_"));
  let loadedCount = 0;

  for (const file of files) {
    const fullPath = path.join(EVENTS_DIR, file);
    try {
      delete require.cache[require.resolve(fullPath)];
      const eventModule = require(fullPath);

      if (!eventModule || !eventModule.config || !eventModule.config.name) {
        logger.warn(`Skipped invalid event file: ${file}`);
        continue;
      }

      const eventName = eventModule.config.name;
      global.JARiF.events.set(eventName, eventModule);

      // Bind listener to client
      if (typeof eventModule.onStart === "function") {
        client.on(eventName, (...args) => {
          try {
            eventModule.onStart({ client, args, eventName });
          } catch (err) {
            logger.error(`Error in event [${eventName}]: ${err.message}`);
          }
        });
      }

      loadedCount++;
    } catch (err) {
      logger.error(`Failed to load event ${file}: ${err.message}`);
    }
  }

  logger.success(`Loaded ${loadedCount} event listener(s).`, "LOADER");
  return loadedCount;
}

function reloadCommand(commandName) {
  const targetName = commandName.toLowerCase();
  const realName = global.JARiF.aliases.get(targetName) || targetName;

  // Find file
  const files = fs.readdirSync(CMDS_DIR).filter(f => f.endsWith(".js"));
  let targetFile = null;

  for (const f of files) {
    const fullPath = path.join(CMDS_DIR, f);
    try {
      const cached = require(fullPath);
      if (cached?.config?.name?.toLowerCase() === realName) {
        targetFile = fullPath;
        break;
      }
    } catch (_) {}
  }

  if (!targetFile) {
    // Attempt by filename
    const directPath = path.join(CMDS_DIR, `${realName}.js`);
    if (fs.existsSync(directPath)) {
      targetFile = directPath;
    }
  }

  if (!targetFile) {
    return { success: false, message: `Command "${commandName}" not found.` };
  }

  // Remove existing aliases
  for (const [alias, mapped] of global.JARiF.aliases.entries()) {
    if (mapped === realName) {
      global.JARiF.aliases.delete(alias);
    }
  }
  global.JARiF.commands.delete(realName);

  const loaded = loadCommandFile(targetFile);
  if (loaded) {
    return { success: true, message: `Command [${loaded}] was reloaded successfully.` };
  } else {
    return { success: false, message: `Failed to reload command [${commandName}].` };
  }
}

module.exports = {
  initGlobal,
  loadAllCommands,
  loadAllEvents,
  loadCommandFile,
  reloadCommand
};
