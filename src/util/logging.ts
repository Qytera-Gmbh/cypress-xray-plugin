import ansiColors from "ansi-colors";
import { isAxiosError } from "axios";
import fs from "fs";
import path from "path";
import { isLoggedError } from "./errors";

const LOG_LEVELS = ["debug", "error", "info", "notice", "warning"] as const;
/**
 * The different log levels the plugin supports and uses.
 */
export type Level = (typeof LOG_LEVELS)[number];

/**
 * A generic logging interface.
 */
export interface Logger {
    /**
     * Configures the logger.
     *
     * @param options - the logging options to use from now on
     */
    configure(options: LoggingOptions): void;
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
     * Writes arbitrary data to a file under the log path configured in
     * {@link configure | `configure`}.
     *
     * @param data - the data to write
     * @param filename - the filename to use for the file
     * @returns the file path
     */
    logToFile(data: string, filename: string): string;
    /**
     * Logs a log message.
     *
     * @param level - the log level
     * @param text - the individual messages
     */
    message(level: Level, ...text: string[]): void;
}

interface LoggingOptions {
    debug?: boolean;
    logDirectory: string;
    logger?: (level: Level, ...text: string[]) => void;
}

/**
 * An ANSI-based logger.
 */
export class PluginLogger implements Logger {
    private readonly prefixes: Record<Level, string>;
    private readonly colorizers: Record<Level, ansiColors.StyleFunction>;
    private readonly logFunctions: Record<Level, (...data: string[]) => void>;
    private loggingOptions: LoggingOptions;

    constructor(options: LoggingOptions = { logDirectory: "." }) {
        this.loggingOptions = options;
        const maxPrefixLength = Math.max(...LOG_LEVELS.map((s) => s.length));
        this.prefixes = {
            ["debug"]: this.prefix("debug", maxPrefixLength),
            ["error"]: this.prefix("error", maxPrefixLength),
            ["info"]: this.prefix("info", maxPrefixLength),
            ["notice"]: this.prefix("notice", maxPrefixLength),
            ["warning"]: this.prefix("warning", maxPrefixLength),
        };
        this.colorizers = {
            ["debug"]: ansiColors.cyan,
            ["error"]: ansiColors.red,
            ["info"]: ansiColors.gray,
            ["notice"]: ansiColors.green,
            ["warning"]: ansiColors.yellow,
        };
        this.logFunctions = {
            ["debug"]: console.debug,
            ["error"]: console.error,
            ["info"]: console.info,
            ["notice"]: console.log,
            ["warning"]: console.warn,
        };
    }

    public message(level: Level, ...text: string[]) {
        // Prefer custom logger to the default plugin one.
        if (this.loggingOptions.logger) {
            this.loggingOptions.logger(level, ...text);
            return;
        }
        if (level === "debug" && !this.loggingOptions.debug) {
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
        const filepath = this.logToFile(JSON.stringify(errorData, null, 2), errorFileName);
        this.message("error", `Complete error logs have been written to: ${filepath}`);
    }

    public configure(options: LoggingOptions): void {
        this.loggingOptions = options;
    }

    private prefix(level: string, maxPrefixLength: number): string {
        return ansiColors.white(
            `│ Cypress Xray Plugin │ ${level.toUpperCase().padEnd(maxPrefixLength, " ")} │`
        );
    }
}

/**
 * A logger which does not print anything itself but rather collects all log messages for later
 * retrieval. Useful for testing purposes.
 */
export class CapturingLogger implements Logger {
    private readonly messages: Parameters<Logger["message"]>[] = [];
    private readonly fileLogMessages: Parameters<Logger["logToFile"]>[] = [];
    private readonly fileLogErrorMessages: Parameters<Logger["logErrorToFile"]>[] = [];

    public message(level: Level, ...text: string[]): void {
        this.messages.push([level, ...text]);
    }

    /**
     * Returns the captured log messages.
     *
     * @returns the log messages
     */
    public getMessages(): readonly Parameters<Logger["message"]>[] {
        return this.messages;
    }

    public logToFile(data: string, filename: string): string {
        this.fileLogMessages.push([data, filename]);
        return filename;
    }

    /**
     * Returns the captured _log to file_ messages.
     *
     * @returns the _log to file_ messages
     */
    public getFileLogMessages(): readonly Parameters<Logger["logToFile"]>[] {
        return this.fileLogMessages;
    }

    public logErrorToFile(error: unknown, filename: string): void {
        this.fileLogErrorMessages.push([error, filename]);
    }

    /**
     * Returns the captured _log error to file_ messages.
     *
     * @returns the _log error to file_ messages
     */
    public getFileLogErrorMessages(): readonly Parameters<Logger["logErrorToFile"]>[] {
        return this.fileLogErrorMessages;
    }

    public configure(): void {
        // Do nothing.
    }
}

/**
 * The global logger instance.
 */
export const LOG: Logger = new PluginLogger();
