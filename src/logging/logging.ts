import chalk from "chalk";

const INFO = "INFO";
const ERROR = "ERROR";
const SUCCESS = "SUCCESS";
const WARNING = "WARNING";
const DEBUG = "DEBUG";

const VARIANTS = [INFO, ERROR, SUCCESS, WARNING, DEBUG];
const MAX_PREFIX_LENGTH = Math.max(...VARIANTS.map((s) => s.length));

function prefix(type: string): string {
    return chalk.white(`| Cypress Xray Plugin | ${type.padEnd(MAX_PREFIX_LENGTH, " ")} |`);
}

export function logInfo(...text: string[]) {
    console.info(prefix(INFO), chalk.gray(text.join(" ")));
}

export function logError(...text: string[]) {
    console.error(prefix(ERROR), chalk.red(text.join(" ")));
}

export function logSuccess(...text: string[]) {
    console.log(prefix(SUCCESS), chalk.green(text.join(" ")));
}

export function logWarning(...text: string[]) {
    console.warn(prefix(WARNING), chalk.yellow(text.join(" ")));
}

export function logDebug(...text: string[]) {
    console.warn(prefix(DEBUG), chalk.cyan(text.join(" ")));
}
