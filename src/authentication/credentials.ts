import { AxiosResponse } from "axios";
import { REST } from "../https/requests";
import { LOG, Level } from "../logging/logging";
import { StringMap } from "../types/util";
import { encode } from "../util/base64";
import { dedent } from "../util/dedent";
import { LoggedError, errorMessage } from "../util/errors";
import { startInterval } from "../util/time";

/**
 * A basic HTTP header.
 * @example
 * ```ts
 *   { "Authorization": "Bearer xyz" }
 *   { "Content-Type": "application/json" }
 * ```
 */
export type HttpHeader = StringMap<string>;

/**
 * The interface which all credential classes must implement. All credentials must be usable in an
 * HTTP authorization request header.
 */
export interface IHttpCredentials {
    /**
     * Returns the HTTP authorization header value of the credentials.
     *
     * @returns the HTTP header value
     */
    getAuthorizationHeader(): HttpHeader | Promise<HttpHeader>;
}

/**
 * A basic authorization credentials class, storing base64 encoded credentials of usernames and
 * passwords.
 */
export class BasicAuthCredentials implements IHttpCredentials {
    private readonly encodedCredentials: string;
    /**
     * Constructs new basic authorization credentials.
     *
     * @param username - the username
     * @param password - the password
     */
    constructor(username: string, password: string) {
        // See: https://developer.atlassian.com/server/jira/platform/basic-authentication/#construct-the-authorization-header
        this.encodedCredentials = encode(`${username}:${password}`);
    }

    public getAuthorizationHeader(): HttpHeader {
        return {
            ["Authorization"]: `Basic ${this.encodedCredentials}`,
        };
    }
}

/**
 * A personal access token (_PAT_) credentials class, storing a secret token to use during HTTP
 * authorization.
 */
export class PATCredentials implements IHttpCredentials {
    /**
     * Constructs new PAT credentials from the provided token.
     *
     * @param token - the token
     */
    constructor(private readonly token: string) {}

    public getAuthorizationHeader(): HttpHeader {
        return {
            ["Authorization"]: `Bearer ${this.token}`,
        };
    }
}

/**
 * A JWT credentials class, storing a JWT token to use during HTTP authorization. The class is
 * designed to retrieve fresh JWT tokens from an authentication URL/endpoint. Once retrieved, the
 * token will be stored and reused whenever necessary.
 */
export class JWTCredentials implements IHttpCredentials {
    private token?: string;

    /**
     * Constructs new JWT credentials. The client ID and client secret will be used to retrieve a
     * JWT token from the authentication URL on demand.
     *
     * @param clientId - the client ID
     * @param clientSecret - the client secret
     * @param authenticationUrl - the authentication URL/token endpoint
     */
    constructor(
        private readonly clientId: string,
        private readonly clientSecret: string,
        private readonly authenticationUrl: string
    ) {
        this.token = undefined;
    }

    /**
     * Return the URL to authenticate to.
     *
     * @returns the URL
     */
    public getAuthenticationUrl(): string {
        return this.authenticationUrl;
    }

    private async getToken(): Promise<string> {
        if (!this.token) {
            try {
                const progressInterval = startInterval((totalTime: number) => {
                    LOG.message(
                        Level.INFO,
                        `Waiting for ${this.authenticationUrl} to respond... (${
                            totalTime / 1000
                        } seconds)`
                    );
                });
                try {
                    LOG.message(Level.INFO, `Authenticating to: ${this.authenticationUrl}...`);
                    const tokenResponse: AxiosResponse<string> = await REST.post(
                        this.authenticationUrl,
                        {
                            client_id: this.clientId,
                            client_secret: this.clientSecret,
                        }
                    );
                    // A JWT token is expected: https://stackoverflow.com/a/74325712
                    const jwtRegex = /^[A-Za-z0-9_-]{2,}(?:\.[A-Za-z0-9_-]{2,}){2}$/;
                    if (jwtRegex.test(tokenResponse.data)) {
                        LOG.message(Level.DEBUG, "Authentication successful.");
                        this.token = tokenResponse.data;
                        return tokenResponse.data;
                    } else {
                        throw new Error("Expected to receive a JWT token, but did not");
                    }
                } finally {
                    clearInterval(progressInterval);
                }
            } catch (error: unknown) {
                const message = errorMessage(error);
                LOG.message(
                    Level.ERROR,
                    dedent(`
                        Failed to authenticate to: ${this.authenticationUrl}

                        ${message}
                    `)
                );
                LOG.logErrorToFile(error, "authentication");
                throw new LoggedError("Authentication failed");
            }
        }
        return this.token;
    }

    public async getAuthorizationHeader(): Promise<HttpHeader> {
        return {
            Authorization: `Bearer ${await this.getToken()}`,
        };
    }
}
