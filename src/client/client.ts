import {
    BasicAuthCredentials,
    JWTCredentials,
    PATCredentials,
} from "../authentication/credentials";
import { logInfo } from "../logging/logging";
import { OneOf } from "../types/util";
import { startInterval } from "../util/timer";

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
     * Starts an informative timer which tells the user for how long they have
     * been waiting for a response already.
     *
     * @param url the request URL
     * @returns the timer's handler
     */
    protected startResponseInterval(url: string): NodeJS.Timer {
        return startInterval((totalTime: number) => {
            logInfo(`Waiting for ${url} to respond... (${totalTime / 1000} seconds)`);
        });
    }
}
