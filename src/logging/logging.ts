import chalk from "chalk";

function prefix(type: string): string {
    return chalk.white(`| Cypress Xray Plugin | ${type} |`);
}

export function logInfo(...text: string[]) {
    console.info(prefix("INFO"), chalk.gray(text.join(" ")));
}

export function logError(...text: string[]) {
    console.error(prefix("ERROR"), chalk.red(text.join(" ")));
}

export function logSuccess(...text: string[]) {
    console.log(prefix("SUCCESS"), chalk.green(text.join(" ")));
}

export function logWarning(...text: string[]) {
    console.warn(prefix("WARNING"), chalk.yellow(text.join(" ")));
}
