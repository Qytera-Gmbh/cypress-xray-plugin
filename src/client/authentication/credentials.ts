import { AxiosResponse } from "axios";
import { StringMap } from "../../types/util";
import { encode } from "../../util/base64";
import { dedent } from "../../util/dedent";
import { LoggedError, errorMessage } from "../../util/errors";
import { LOG, Level } from "../../util/logging";
import { startInterval } from "../../util/time";
import { REST } from "../https/requests";

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
export interface HttpCredentials {
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
export class BasicAuthCredentials implements HttpCredentials {
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
export class PatCredentials implements HttpCredentials {
    private readonly token: string;
    /**
     * Constructs new PAT credentials from the provided token.
     *
     * @param token - the token
     */
    constructor(token: string) {
        this.token = token;
    }

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
export class JwtCredentials implements HttpCredentials {
    private token?: Promise<string>;
    private readonly clientId: string;
    private readonly clientSecret: string;
    private readonly authenticationUrl: string;

    /**
     * Constructs new JWT credentials. The client ID and client secret will be used to retrieve a
     * JWT token from the authentication URL on demand.
     *
     * @param clientId - the client ID
     * @param clientSecret - the client secret
     * @param authenticationUrl - the authentication URL/token endpoint
     */
    constructor(clientId: string, clientSecret: string, authenticationUrl: string) {
        this.token = undefined;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.authenticationUrl = authenticationUrl;
    }

    /**
     * Return the URL to authenticate to.
     *
     * @returns the URL
     */
    public getAuthenticationUrl(): string {
        return this.authenticationUrl;
    }

    public async getAuthorizationHeader(): Promise<HttpHeader> {
        if (!this.token) {
            this.fetchToken();
        }
        return {
            ["Authorization"]: `Bearer ${(await this.token) ?? "undefined"}`,
        };
    }

    private fetchToken(): void {
        this.token = new Promise((resolve, reject) => {
            const progressInterval = startInterval((totalTime: number) => {
                LOG.message(
                    Level.INFO,
                    `Waiting for ${this.authenticationUrl} to respond... (${(
                        totalTime / 1000
                    ).toString()} seconds)`
                );
            });
            LOG.message(Level.INFO, `Authenticating to: ${this.authenticationUrl}...`);
            const body = {
                ["client_id"]: this.clientId,
                ["client_secret"]: this.clientSecret,
            };
            REST.post<string>(this.authenticationUrl, body)
                .then((response: AxiosResponse<string>) => {
                    // A JWT token is expected: https://stackoverflow.com/a/74325712
                    const jwtRegex = /^[A-Za-z0-9_-]{2,}(?:\.[A-Za-z0-9_-]{2,}){2}$/;
                    if (jwtRegex.test(response.data)) {
                        LOG.message(Level.DEBUG, "Authentication successful.");
                        resolve(response.data);
                    } else {
                        reject(new Error("Expected to receive a JWT token, but did not"));
                    }
                })
                .catch((error: unknown) => {
                    const message = errorMessage(error);
                    LOG.message(
                        Level.ERROR,
                        dedent(`
                            Failed to authenticate to: ${this.authenticationUrl}

                            ${message}
                        `)
                    );
                    LOG.logErrorToFile(error, "authentication");
                    reject(new LoggedError("Authentication failed"));
                })
                .finally(() => {
                    clearInterval(progressInterval);
                });
        });
    }
}
