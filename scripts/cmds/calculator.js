/**
 * JARiF Command: calculator
 * Safe arithmetic calculator with onReply chain support
 */

const { boxText } = require("../../core/utils");

function safeCalculate(expression) {
  // Allow only numbers, parentheses, and arithmetic operators
  const sanitized = expression.replace(/[^0-9+\-*/().%^ ]/g, "").replace(/\^/g, "**");
  if (!sanitized.trim()) return null;

  try {
    const fn = new Function(`"use strict"; return (${sanitized});`);
    const result = fn();
    if (typeof result !== "number" || isNaN(result) || !isFinite(result)) return null;
    return result;
  } catch (_) {
    return null;
  }
}

module.exports = {
  config: {
    name: "calculator",
    version: "1.0.0",
    author: "JARiF",
    role: 0,
    cooldown: 3,
    description: "Calculates mathematical expressions with onReply chaining",
    usages: "<expression>",
    category: "Utility",
    aliases: ["calc", "math"],
    hasPrefix: true
  },

  onStart: async function({ message, args, reply, setReply }) {
    if (!args.length) {
      return reply("⚠️ Usage: `.calc <expression>` (e.g., `.calc 15 * 8 + (24 / 2)`)");
    }

    const expr = args.join(" ");
    const result = safeCalculate(expr);

    if (result === null) {
      return reply("❌ Invalid mathematical expression.");
    }

    const content = [
      `• Expression: \`${expr}\``,
      `• Result: **${result}**`,
      `\n💡 *Reply with an operator and number (e.g. \`+ 20\`) to continue calculating!*`
    ].join("\n");

    const sent = await reply(boxText("CALCULATOR", content));
    setReply(sent, { currentResult: result });
  },

  onReply: async function({ message, Reply, reply, setReply }) {
    const input = message.content.trim();
    const chainedExpr = `${Reply.currentResult} ${input}`;
    const newResult = safeCalculate(chainedExpr);

    if (newResult === null) {
      return reply("❌ Could not compute chained expression. Example format: `+ 50` or `* 2`");
    }

    const content = [
      `• Chained: \`${Reply.currentResult} ${input}\``,
      `• Result: **${newResult}**`,
      `\n💡 *Reply again to continue calculating!*`
    ].join("\n");

    const sent = await reply(boxText("CALCULATOR", content));
    setReply(sent, { currentResult: newResult });
  }
};
