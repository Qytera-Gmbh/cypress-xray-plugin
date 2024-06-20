import { LOG, Level } from "../util/logging";
import { startInterval } from "../util/time";
import { HttpCredentials } from "./authentication/credentials";
import { AxiosRestClient } from "./https/requests";

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
    protected readonly credentials: HttpCredentials;
    /**
     * The HTTP client to use for dispatching requests.
     */
    protected readonly httpClient: AxiosRestClient;

    /**
     * Construct a new client using the provided credentials.
     *
     * @param apiBaseUrl - the base URL for all HTTP requests
     * @param credentials - the credentials to use during authentication
     * @param httpClient - the HTTP client to use for dispatching requests
     */
    constructor(apiBaseUrl: string, credentials: HttpCredentials, httpClient: AxiosRestClient) {
        this.apiBaseUrl = apiBaseUrl;
        this.credentials = credentials;
        this.httpClient = httpClient;
    }

    /**
     * Return the client's credentials;
     *
     * @returns the credentials
     */
    public getCredentials(): HttpCredentials {
        return this.credentials;
    }

    /**
     * Starts an informative timer which tells the user for how long they have
     * been waiting for a response already.
     *
     * @param url - the request URL
     * @returns the timer's handler
     */
    protected startResponseInterval(url: string): ReturnType<typeof setInterval> {
        return startInterval((totalTime: number) => {
            LOG.message(
                Level.INFO,
                `Waiting for ${url} to respond... (${(totalTime / 1000).toString()} seconds)`
            );
        });
    }
}
