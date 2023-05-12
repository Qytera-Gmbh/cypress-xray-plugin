import { isAxiosError } from "axios";
import { writeFileSync } from "fs";
import {
    APICredentials,
    APICredentialsOptions,
} from "../authentication/credentials";
import { logError, logInfo } from "../logging/logging";

/**
 * A basic client interface which stores credentials data used for
 * communicating with the server.
 */
export abstract class Client<T extends APICredentials<APICredentialsOptions>> {
    protected readonly credentials: T;

    /**
     * Construct a new client using the provided credentials.
     *
     * @param credentials the credentials to use during authentication
     */
    constructor(credentials: T) {
        this.credentials = credentials;
    }

    /**
     * Return the client's credentials;
     *
     * @returns the credentials
     */
    public getCredentials(): T {
        return this.credentials;
    }

    /**
     * Writes an error to a file (e.g. HTTP response errors).
     *
     * @param error the error
     * @param filename the filename to use for the file
     */
    protected writeErrorFile(error: unknown, filename: string): void {
        let errorFileName: string;
        let errorData: string;
        if (isAxiosError(error)) {
            errorFileName = `${filename}.json`;
            errorData = JSON.stringify({
                error: error.toJSON(),
                response: error.response?.data,
            });
        } else {
            errorFileName = `${filename}.log`;
            errorData = JSON.stringify(error);
        }
        writeFileSync(errorFileName, errorData);
        logError(`Complete error logs have been written to "${errorFileName}"`);
    }

    private readonly LOG_RESPONSE_INTERVAL_MS = 10000;

    /**
     * Starts an informative timer which tells the user for how long they have
     * been waiting for a response already.
     *
     * @param url the request URL
     * @returns a function to access the timer's underlying handler
     */
    protected startResponseInterval(url: string): () => NodeJS.Timer {
        let sumTime = 0;
        const callback = () => {
            sumTime = sumTime + this.LOG_RESPONSE_INTERVAL_MS;
            logInfo(
                `Waiting for ${url} to respond... (${sumTime / 1000} seconds)`
            );
            clearInterval(progressInterval);
            progressInterval = setInterval(
                callback,
                this.LOG_RESPONSE_INTERVAL_MS
            );
        };
        let progressInterval = setInterval(
            callback,
            this.LOG_RESPONSE_INTERVAL_MS
        );
        return () => progressInterval;
    }
}
