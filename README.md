# 🐔 COCK Discord SelfBot Edition

> ⚠️ **Disclaimer:** Selfbots automate Discord user accounts, which is against [Discord's Terms of Service](https://discord.com/terms). Using a selfbot may lead to account suspension or termination. Use this project strictly for educational, experimental, or local development purposes.

---

## 🌟 Highlights & COCK Features

- **🧱 COCK Architecture**:
  - `config.json`: Global configuration, prefix, permissions, and status.
  - `scripts/cmds/`: Modular, isolated command files with full lifecycle hooks.
  - `scripts/events/`: Modular event listeners mapped directly to Discord Gateway events.
  - `core/`: Custom loader, hot-reloader, dispatcher, and stylized terminal logger.
- **🔄 Complete Lifecycle Hooks**:
  - `onStart`: Fired when a user or self runs a command.
  - `onChat`: Fired on every message received (e.g. AFK alerts, keyword detection, auto-responders).
  - `onReply`: Interactive multi-step conversations (e.g., interactive help menu, chained calculator).
  - `onReaction`: Interactive reaction handling.
- **⚡ Hot Reloading**: Reload or load new commands on the fly without restarting the selfbot via `.cmd reload <name>`!
- **🎨 COCK Terminal Logger**: Colorful ASCII COCK banner and structured logging (`[ SUCCESS ]`, `[ COMMAND ]`, `[ EVENT ]`, etc.).

---

## 📁 Project Structure

```
dc_selfbot/
├── config.json              # Main bot settings (prefix, adminBot, selfbotOnly, status)
├── index.js                 # App entry point, loader bootstrap, gateway connection
├── package.json
├── .env.example             # Token environment template
├── core/
│   ├── handlers.js          # Dispatches onStart, onChat, onReply, onReaction
│   ├── loader.js            # Dynamic command & event loader + hot-reload logic
│   ├── logger.js            # JARiF styled console logger & ASCII art banner
│   └── utils.js             # Formatting, box styling, time & args helpers
├── scripts/
│   ├── cmds/                # Command scripts
│   │   ├── newcommand.eg.js # Template to create your own commands
│   │   ├── help.js          # Interactive paginated help with onReply
│   │   ├── ping.js          # Gateway & WebSocket latency
│   │   ├── info.js          # System, RAM, and selfbot metrics
│   │   ├── afk.js           # AFK system with auto-removal and mention alert
│   │   ├── purge.js         # Mass-delete self messages safely
│   │   ├── snipe.js         # Snipes recently deleted messages in channel
│   │   ├── eval.js          # Secure JS execution with execution timers
│   │   ├── cmd.js           # JARiF command manager (load, reload, list)
│   │   ├── status.js        # Rich presence & custom activity updater
│   │   ├── avatar.js        # High-res avatar fetcher (PNG/WEBP/GIF)
│   │   ├── userinfo.js      # Detailed user profile inspector
│   │   ├── serverinfo.js    # Guild info and stats
│   │   ├── calculator.js    # Math engine with onReply step-by-step chaining
│   │   └── quote.js         # Message quoter and aesthetic box formatter
│   └── events/              # Event listeners
│       ├── ready.js         # Gateway ready hook & presence initializer
│       └── messageDelete.js # Deleted message caching for snipe
```

---

## 🚀 Getting Started

### 1. Requirements
- Node.js **18.x** or higher (tested on Node v24).
- A Discord user token.

### 2. Configure Token
Copy `.env.example` to `.env` or set your token in `config.json`:

```env
DISCORD_TOKEN=your_user_token_here
```

Or edit `config.json`:
```json
{
  "prefix": ".",
  "selfbotOnly": true,
  "adminBot": ["YOUR_FRIEND_OR_ALT_USER_ID"],
  "token": "your_user_token_here"
}
```

### 3. Run the Bot
```bash
node index.js
```

---

## 📝 Writing Commands

To add a new command, create a file in `scripts/cmds/` (e.g. `hello.js`):

```javascript
module.exports = {
  config: {
    name: "hello",
    version: "1.0.0",
    author: "JARiF",
    role: 0, // 0: Everyone (or Self in selfbot mode), 1: Admin, 2: Owner/Self only
    cooldown: 5,
    description: "Says hello and registers an onReply session",
    usages: "",
    category: "General",
    aliases: ["hi", "greet"],
    hasPrefix: true
  },

  onStart: async function({ message, reply, setReply }) {
    const sent = await reply("Hello! How are you today? Reply to this message!");
    setReply(sent, { step: 1 });
  },

  onReply: async function({ message, Reply, reply }) {
    await reply(`Nice to hear! You replied: "${message.content}"`);
  }
};
```

Once saved, reload it instantly inside Discord without restarting the bot:
```
.cmd load hello.js
```
or
```
.cmd reload hello
```

---

## 🛠️ Included Commands Summary

| Command | Category | Role | Description |
|---|---|---|---|
| `.help [cmd\|page]` | General | 0 | Interactive menu with onReply support |
| `.ping` | Utility | 0 | Discord gateway & websocket ping |
| `.info` | General | 0 | System memory, uptime, command stats |
| `.afk [reason]` | Utility | 0 | AFK status with onChat auto-mention alerts |
| `.snipe` | Utility | 0 | View the last deleted message in channel |
| `.calc <expr>` | Utility | 0 | Calculator with continuous onReply chaining |
| `.avatar [@user]` | Utility | 0 | High-res avatar extractor |
| `.userinfo [@user]` | Utility | 0 | Account creation, roles, and profile info |
| `.serverinfo` | Utility | 0 | Server metrics, boost levels, channels |
| `.quote <id\|text>` | Fun | 0 | Quote message or aesthetic quotation |
| `.purge <amount>` | Selfbot | 2 | Delete your own messages in current channel |
| `.status <mode>` | Selfbot | 2 | Change presence & Rich Presence activity |
| `.join [id]` | Voice | 0 | Connects to author's VC or specified channel ID |
| `.leave` | Voice | 0 | Disconnects from VC and clears audio resources |
| `.play <query>` | Music | 0 | Streams YouTube music directly into voice channel |
| `.sing <query>` | Music | 0 | Converts YouTube song & sends as voice attachment |
| `.queue` | Music | 0 | Displays current playing track and queue list |
| `.skip` | Music | 0 | Skips the currently playing voice track |
| `.stop` | Music | 0 | Stops playback and clears the upcoming queue |
| `.eval <code>` | Admin | 2 | Execute JavaScript code in runtime |
| `.cmd <action>` | Admin | 2 | Reload, load, or unload commands live |
