import { isAxiosError } from "axios";
import chalk from "chalk";
import fs from "fs";
import path from "path";

const INFO = "INFO";
const ERROR = "ERROR";
const SUCCESS = "SUCCESS";
const WARNING = "WARNING";
const DEBUG = "DEBUG";

const VARIANTS = [INFO, ERROR, SUCCESS, WARNING, DEBUG];
const MAX_PREFIX_LENGTH = Math.max(...VARIANTS.map((s) => s.length));
const PREFIXES = {
    info: prefix(INFO),
    error: prefix(ERROR),
    success: prefix(SUCCESS),
    warning: prefix(WARNING),
    debug: prefix(DEBUG),
};

export interface LoggingOptions {
    debug?: boolean;
    logDirectory: string;
}

let loggingOptions: LoggingOptions;

export function initLogging(options: LoggingOptions) {
    loggingOptions = options;
}
function prefix(type: string): string {
    return chalk.white(`│ Cypress Xray Plugin │ ${type.padEnd(MAX_PREFIX_LENGTH, " ")} │`);
}

export const logInfo = (...text: string[]) => {
    log(text, PREFIXES.info, console.log, chalk.gray);
};

export const logError = (...text: string[]) => {
    log(text, PREFIXES.error, console.error, chalk.red);
};

export const logSuccess = (...text: string[]) => {
    log(text, PREFIXES.success, console.log, chalk.green);
};

export const logWarning = (...text: string[]) => {
    log(text, PREFIXES.warning, console.error, chalk.yellow);
};

export const logDebug = (...text: string[]) => {
    if (loggingOptions.debug) {
        log(text, PREFIXES.debug, console.log, chalk.cyan);
    }
};

function log(
    text: string[],
    prefix: string,
    logger: (...text: unknown[]) => void,
    colorizer: (...text: unknown[]) => string
) {
    const lines = text.join(" ").split("\n");
    lines.forEach((line: string, index: number) => {
        if (index === 0) {
            logger(`${prefix} ${colorizer(line)}`);
        } else {
            logger(`${prefix} ┊ ${colorizer(line)}`);
        }
        // Pad multiline log messages with an extra new line to cleanly separate them from the
        // following line.
        if (index > 1 && index === lines.length - 1) {
            logger(`${prefix} ┊`);
        }
    });
}

/**
 * Writes arbitrary data to a file under the log path configured in
 * {@link initLogging `initLogging`}.
 *
 * @param data the data to write
 * @param filename the filename to use for the file
 */
export function writeFile<T>(data: T, filename: string): void {
    const logDirectoryPath = path.resolve(loggingOptions.logDirectory);
    fs.mkdirSync(logDirectoryPath, { recursive: true });
    const filepath = path.resolve(logDirectoryPath, filename);
    fs.writeFileSync(filepath, JSON.stringify(data));
}

/**
 * Writes an error to a file (e.g. HTTP response errors) under the log path configured in
 * {@link initLogging `initLogging`}.
 *
 * @param error the error
 * @param filename the filename to use for the file
 */
export function writeErrorFile(error: unknown, filename: string): void {
    let errorFileName: string;
    let errorData: string;
    if (isAxiosError(error)) {
        errorFileName = `${filename}.json`;
        errorData = JSON.stringify({
            error: error.toJSON(),
            response: error.response?.data,
        });
    } else if (error instanceof Error) {
        errorFileName = `${filename}.json`;
        errorData = JSON.stringify({
            error: `${error.name}: ${error.message}`,
            stacktrace: error.stack,
        });
    } else {
        errorFileName = `${filename}.log`;
        errorData = JSON.stringify(error);
    }
    const logDirectoryPath = path.resolve(loggingOptions.logDirectory);
    fs.mkdirSync(logDirectoryPath, { recursive: true });
    errorFileName = path.resolve(logDirectoryPath, errorFileName);
    fs.writeFileSync(errorFileName, errorData);
    logError(`Complete error logs have been written to: ${errorFileName}`);
}
