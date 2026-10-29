/**
 * JARiF Command: eval
 * Evaluates arbitrary JavaScript code (Owner only)
 */

const util = require("util");
const { boxText, codeBlock } = require("../../core/utils");

module.exports = {
  config: {
    name: "eval",
    version: "1.0.0",
    author: "JARiF",
    role: 2, // Restricted to owner
    cooldown: 0,
    description: "Executes JavaScript code in the current runtime",
    usages: "<code>",
    category: "Admin",
    aliases: ["e", "js"],
    hasPrefix: true
  },

  onStart: async function({ client, message, args, reply }) {
    if (!args.length) {
      return reply("⚠️ Please provide JavaScript code to evaluate.");
    }

    const code = args.join(" ");
    const startTime = Date.now();

    try {
      let evaled = eval(code);
      if (evaled instanceof Promise) {
        evaled = await evaled;
      }

      const elapsed = Date.now() - startTime;
      let output = util.inspect(evaled, { depth: 1 });

      // Clean sensitive tokens from output
      const token = client.token;
      if (token) {
        output = output.replace(new RegExp(token, "g"), "[REDACTED TOKEN]");
      }

      if (output.length > 1800) {
        output = output.slice(0, 1800) + "\n... (truncated)";
      }

      return reply(codeBlock("js", output) + `\n⏱️ Execution time: **${elapsed}ms**`);
    } catch (err) {
      const elapsed = Date.now() - startTime;
      return reply(`❌ **Evaluation Error:**\n${codeBlock("js", err.stack || err.message)}\n⏱️ Failed after: **${elapsed}ms**`);
    }
  }
};
