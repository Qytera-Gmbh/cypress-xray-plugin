import { isAxiosError } from "axios";
import chalk from "chalk";
import fs from "fs";
import path from "path";
import { isLoggedError } from "../util/errors";

export enum Level {
    INFO = "INFO",
    ERROR = "ERROR",
    SUCCESS = "SUCCESS",
    WARNING = "WARNING",
    DEBUG = "DEBUG",
}

/**
 * A generic logging interface.
 */
export interface Logger {
    /**
     * Logs a log message.
     *
     * @param text - the individual messages
     */
    message(level: Level, ...text: string[]): void;
    /**
     * Writes arbitrary data to a file under the log path configured in
     * {@link configure | `configure`}.
     *
     * @param data - the data to write
     * @param filename - the filename to use for the file
     * @returns the file path
     */
    logToFile(data: string, filename: string): string;
    /**
     * Writes an error to a file under the log path configured in
     * {@link configure | `configure`}.
     *
     * @param error - the error
     * @param filename - the filename to use for the file
     * @returns the file path
     */
    logErrorToFile(error: unknown, filename: string): void;
    /**
     * Configures the logger.
     *
     * @param options - the logging options to use from now on
     */
    configure(options: LoggingOptions): void;
}

export interface LoggingOptions {
    debug?: boolean;
    logDirectory: string;
}

/**
 * A Chalk-based logger.
 */
export class PluginLogger implements Logger {
    private readonly prefixes: Record<Level, string>;
    private readonly colorizers: Record<Level, chalk.Chalk>;
    private readonly logFunctions: Record<Level, (...data: unknown[]) => void>;
    private loggingOptions: LoggingOptions;

    constructor(options: LoggingOptions = { logDirectory: "." }) {
        this.loggingOptions = options;
        const maxPrefixLength = Math.max(...Object.values(Level).map((s) => s.length));
        this.prefixes = {
            [Level.INFO]: this.prefix(Level.INFO, maxPrefixLength),
            [Level.ERROR]: this.prefix(Level.ERROR, maxPrefixLength),
            [Level.SUCCESS]: this.prefix(Level.SUCCESS, maxPrefixLength),
            [Level.WARNING]: this.prefix(Level.WARNING, maxPrefixLength),
            [Level.DEBUG]: this.prefix(Level.DEBUG, maxPrefixLength),
        };
        this.colorizers = {
            [Level.INFO]: chalk.gray,
            [Level.ERROR]: chalk.red,
            [Level.SUCCESS]: chalk.green,
            [Level.WARNING]: chalk.yellow,
            [Level.DEBUG]: chalk.cyan,
        };
        this.logFunctions = {
            [Level.INFO]: console.info,
            [Level.ERROR]: console.error,
            [Level.SUCCESS]: console.log,
            [Level.WARNING]: console.warn,
            [Level.DEBUG]: console.debug,
        };
    }

    public message(level: Level, ...text: string[]) {
        if (level === Level.DEBUG && !this.loggingOptions.debug) {
            return;
        }
        const colorizer = this.colorizers[level];
        const prefix = this.prefixes[level];
        const logFunction = this.logFunctions[level];
        const lines = text.join(" ").split("\n");
        lines.forEach((line: string, index: number) => {
            if (index === 0) {
                logFunction(`${prefix} ${colorizer(line)}`);
            } else {
                logFunction(`${prefix}   ${colorizer(line)}`);
            }
            // Pad multiline log messages with an extra new line to cleanly separate them from the
            // following line.
            if (index > 0 && index === lines.length - 1) {
                logFunction(prefix);
            }
        });
    }

    public logToFile(data: string, filename: string): string {
        const logDirectoryPath = path.resolve(this.loggingOptions.logDirectory);
        fs.mkdirSync(logDirectoryPath, { recursive: true });
        const filepath = path.resolve(logDirectoryPath, filename);
        fs.writeFileSync(filepath, data);
        return filepath;
    }

    public logErrorToFile(error: unknown, filename: string): void {
        let errorFileName: string;
        let errorData: unknown;
        if (isLoggedError(error)) {
            return;
        }
        if (isAxiosError(error)) {
            errorFileName = `${filename}.json`;
            errorData = {
                error: error.toJSON(),
                response: error.response?.data as unknown,
            };
        } else if (error instanceof Error) {
            errorFileName = `${filename}.json`;
            errorData = {
                error: `${error.name}: ${error.message}`,
                stacktrace: error.stack,
            };
        } else {
            errorFileName = `${filename}.log`;
            errorData = error;
        }
        const filepath = this.logToFile(JSON.stringify(errorData), errorFileName);
        this.message(Level.ERROR, `Complete error logs have been written to: ${filepath}`);
    }

    public configure(options: LoggingOptions): void {
        this.loggingOptions = options;
    }

    private prefix(type: string, maxPrefixLength: number): string {
        return chalk.white(`│ Cypress Xray Plugin │ ${type.padEnd(maxPrefixLength, " ")} │`);
    }
}

/**
 * The global logger instance.
 */
export const LOG: Logger = new PluginLogger();
