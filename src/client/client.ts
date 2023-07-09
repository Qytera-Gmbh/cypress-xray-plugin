import { isAxiosError } from "axios";
import { writeFileSync } from "fs";
import {
    BasicAuthCredentials,
    JWTCredentials,
    PATCredentials,
} from "../authentication/credentials";
import { logError, logInfo } from "../logging/logging";
import { OneOf } from "../types/util";

/**
 * A basic client interface which stores credentials data used for communicating with a server.
 */
export abstract class Client<
    T extends OneOf<[BasicAuthCredentials, PATCredentials, JWTCredentials]>
> {
    /**
     * The server URL.
     */
    protected readonly apiBaseURL: string;
    /**
     * The credentials to use for authentication.
     */
    protected readonly credentials: T;

    /**
     * Construct a new client using the provided credentials.
     *
     * @param apiBaseUrl the base URL for all HTTP requests
     * @param credentials the credentials to use during authentication
     */
    constructor(apiBaseUrl: string, credentials: T) {
        this.apiBaseURL = apiBaseUrl;
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
     * @param methodName a (readable) name of the method which caused the error
     */
    protected writeErrorFile(error: unknown, methodName: string): void {
        let errorFileName: string;
        let errorData: string;
        if (isAxiosError(error)) {
            errorFileName = `${methodName}Error.json`;
            errorData = JSON.stringify({
                error: error.toJSON(),
                response: error.response?.data,
            });
        } else {
            errorFileName = `${methodName}Error.log`;
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
     * @returns the timer's handler
     */
    protected startResponseInterval(url: string): NodeJS.Timer {
        let sumTime = 0;
        const callback = () => {
            sumTime = sumTime + this.LOG_RESPONSE_INTERVAL_MS;
            logInfo(`Waiting for ${url} to respond... (${sumTime / 1000} seconds)`);
        };
        return setInterval(callback, this.LOG_RESPONSE_INTERVAL_MS);
    }
}
