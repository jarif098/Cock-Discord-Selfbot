/**
 * COCK Logger - Stylized terminal logger
 */

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  
  // Foreground
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",

  // Background
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgBlue: "\x1b[44m",
  bgGreen: "\x1b[42m",
  bgRed: "\x1b[41m"
};

const getTimestamp = () => {
  const d = new Date();
  return d.toLocaleTimeString();
};

const logger = {
  colors,

  banner() {
    const art = `
${colors.magenta}${colors.bright}
   ██████╗  ██████╗   ██████╗██╗  ██╗
  ██╔════╝ ██╔═══██╗ ██╔════╝██║ ██╔╝
  ██║      ██║   ██║ ██║     █████═╝ 
  ██║      ██║   ██║ ██║     ██╔═██╗ 
  ╚██████╗ ╚██████╔╝ ╚██████╗██║ ╚██╗
   ╚═════╝  ╚═════╝   ╚═════╝╚═╝  ╚═╝
${colors.cyan}         [ Discord SelfBot Edition • COCK Architecture ]${colors.reset}
`;
    console.log(art);
  },

  info(msg, prefix = "INFO") {
    console.log(`${colors.gray}[${getTimestamp()}]${colors.reset} ${colors.cyan}[ ${prefix} ]${colors.reset} ${msg}`);
  },

  success(msg, prefix = "SUCCESS") {
    console.log(`${colors.gray}[${getTimestamp()}]${colors.reset} ${colors.green}${colors.bright}[ ${prefix} ]${colors.reset} ${msg}`);
  },

  warn(msg, prefix = "WARN") {
    console.log(`${colors.gray}[${getTimestamp()}]${colors.reset} ${colors.yellow}${colors.bright}[ ${prefix} ]${colors.reset} ${msg}`);
  },

  error(msg, prefix = "ERROR") {
    console.log(`${colors.gray}[${getTimestamp()}]${colors.reset} ${colors.red}${colors.bright}[ ${prefix} ]${colors.reset} ${msg}`);
  },

  cmd(msg) {
    console.log(`${colors.gray}[${getTimestamp()}]${colors.reset} ${colors.magenta}${colors.bright}[ COMMAND ]${colors.reset} ${msg}`);
  },

  event(msg) {
    console.log(`${colors.gray}[${getTimestamp()}]${colors.reset} ${colors.blue}${colors.bright}[ EVENT ]${colors.reset} ${msg}`);
  },

  cock(msg) {
    console.log(`${colors.gray}[${getTimestamp()}]${colors.reset} ${colors.bgMagenta}${colors.white}${colors.bright} COCK ${colors.reset} ${msg}`);
  },

  goat(msg) {
    this.cock(msg);
  }
};

module.exports = logger;
