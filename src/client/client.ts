import { IHttpCredentials } from "../authentication/credentials";
import { logInfo } from "../logging/logging";
import { startInterval } from "../util/time";

/**
 * A basic client interface which stores credentials data used for communicating with a server.
 */
export abstract class Client {
    /**
     * The server URL.
     */
    protected readonly apiBaseUrl: string;
    /**
     * The credentials to use for authentication.
     */
    protected readonly credentials: IHttpCredentials;

    /**
     * Construct a new client using the provided credentials.
     *
     * @param apiBaseUrl - the base URL for all HTTP requests
     * @param credentials - the credentials to use during authentication
     */
    constructor(apiBaseUrl: string, credentials: IHttpCredentials) {
        this.apiBaseUrl = apiBaseUrl;
        this.credentials = credentials;
    }

    /**
     * Return the client's credentials;
     *
     * @returns the credentials
     */
    public getCredentials(): IHttpCredentials {
        return this.credentials;
    }

    /**
     * Starts an informative timer which tells the user for how long they have
     * been waiting for a response already.
     *
     * @param url - the request URL
     * @returns the timer's handler
     */
    protected startResponseInterval(url: string): NodeJS.Timer {
        return startInterval((totalTime: number) => {
            logInfo(`Waiting for ${url} to respond... (${totalTime / 1000} seconds)`);
        });
    }
}
