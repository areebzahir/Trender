/**
 * Simple structured logger for the furniture scraper.
 */

type LogLevel = 'info' | 'success' | 'warn' | 'error' | 'debug';

const ICONS: Record<LogLevel, string> = {
  info:    'ℹ️ ',
  success: '✅',
  warn:    '⚠️ ',
  error:   '❌',
  debug:   '🔍',
};

const COLORS: Record<LogLevel, string> = {
  info:    '\x1b[36m',   // cyan
  success: '\x1b[32m',   // green
  warn:    '\x1b[33m',   // yellow
  error:   '\x1b[31m',   // red
  debug:   '\x1b[90m',   // grey
};

const RESET = '\x1b[0m';

let debugEnabled = process.env.SCRAPER_DEBUG === 'true' || process.argv.includes('--verbose');

export const logger = {
  info:    (msg: string) => log('info', msg),
  success: (msg: string) => log('success', msg),
  warn:    (msg: string) => log('warn', msg),
  error:   (msg: string) => log('error', msg),
  debug:   (msg: string) => { if (debugEnabled) log('debug', msg); },
  section: (title: string) => {
    console.log(`\n${COLORS.info}${'─'.repeat(60)}${RESET}`);
    console.log(`${COLORS.info}  ${title}${RESET}`);
    console.log(`${COLORS.info}${'─'.repeat(60)}${RESET}`);
  },
  summary: (stats: Record<string, number | string>) => {
    console.log(`\n${COLORS.success}${'═'.repeat(60)}${RESET}`);
    console.log(`${COLORS.success}  📊 Summary${RESET}`);
    console.log(`${COLORS.success}${'═'.repeat(60)}${RESET}`);
    for (const [key, val] of Object.entries(stats)) {
      console.log(`  ${key.padEnd(25)} ${val}`);
    }
    console.log(`${COLORS.success}${'═'.repeat(60)}${RESET}\n`);
  },
};

function log(level: LogLevel, msg: string): void {
  const ts = new Date().toISOString().slice(11, 19); // HH:MM:SS
  console.log(`${COLORS[level]}[${ts}] ${ICONS[level]}  ${msg}${RESET}`);
}
