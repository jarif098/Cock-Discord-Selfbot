/**
 * Utility functions for JARiF Discord Selfbot
 */

const axios = require("axios");

const formatUptime = (ms) => {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(" ");
};

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

const boxText = (title, content) => {
  return `╭─── [ **${title.toUpperCase()}** ]\n${content.split("\n").map(l => `│ ${l}`).join("\n")}\n╰────────────────────────`;
};

const codeBlock = (lang, text) => {
  return `\`\`\`${lang}\n${text}\n\`\`\``;
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const parseArgs = (content, prefix) => {
  if (!content.startsWith(prefix)) return { commandName: "", args: [] };
  const slice = content.slice(prefix.length).trim();
  const args = slice.split(/\s+/);
  const commandName = args.shift()?.toLowerCase() || "";
  return { commandName, args };
};

const getStreamFromURL = async (url) => {
  const response = await axios({
    method: "get",
    url,
    responseType: "stream"
  });
  return response.data;
};

module.exports = {
  formatUptime,
  formatBytes,
  boxText,
  codeBlock,
  sleep,
  parseArgs,
  getStreamFromURL
};
