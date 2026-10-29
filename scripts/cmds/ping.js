/**
 * JARiF Command: ping
 */

const { boxText } = require("../../core/utils");

module.exports = {
  config: {
    name: "ping",
    version: "1.0.0",
    author: "JARiF",
    role: 0,
    cooldown: 5,
    description: "Checks WebSocket latency and gateway response time",
    usages: "",
    category: "Utility",
    aliases: ["p", "latency", "pong"],
    hasPrefix: true
  },

  onStart: async function({ client, message, reply }) {
    const start = Date.now();
    const sent = await reply("🏓 Pinging Discord Gateway...");
    const latency = Date.now() - start;
    const wsPing = client.ws.ping;

    const stats = [
      `• Latency: **${latency}ms**`,
      `• WebSocket: **${wsPing < 0 ? "Measuring..." : `${wsPing}ms`}**`,
      `• Status: **${wsPing < 150 ? "🟢 Excellent" : wsPing < 300 ? "🟡 Moderate" : "🔴 High"}**`
    ].join("\n");

    try {
      await sent.edit(boxText("COCK LATENCY", stats));
    } catch (_) {
      await reply(boxText("COCK LATENCY", stats));
    }
  }
};
