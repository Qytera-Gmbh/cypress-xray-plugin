import chalk from "chalk";

const PREFIX = "| Cypress Xray Plugin |";

export function log(...text: string[]) {
    console.log(`${chalk.white(PREFIX)} ${chalk.blue(text.join(" "))}`);
}

export function info(...text: string[]) {
    console.log(`${chalk.white(PREFIX)} ${chalk.gray(text.join(" "))}`);
}

export function error(...text: string[]) {
    console.error(`${chalk.white(PREFIX)} ${chalk.red(text.join(" "))}`);
}

export function success(...text: string[]) {
    console.log(`${chalk.white(PREFIX)} ${chalk.green(text.join(" "))}`);
}

export function warning(...text: string[]) {
    console.log(`${chalk.white(PREFIX)} ${chalk.yellow(text.join(" "))}`);
}
