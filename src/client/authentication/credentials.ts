import { encode } from "../../util/base64";
import { LOG } from "../../util/logging";
import type { AxiosRestClient } from "../https/requests";
import { loggedRequest } from "../util";

/**
 * A basic HTTP authorization header.
 *
 * @example
 *
 * ```ts
 * { "Authorization": "Bearer xyz" }
 * ```
 */
interface AuthorizationHeader {
    ["Authorization"]: string;
}

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
    getAuthorizationHeader(): AuthorizationHeader | Promise<AuthorizationHeader>;
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

    public getAuthorizationHeader(): AuthorizationHeader {
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

    public getAuthorizationHeader(): AuthorizationHeader {
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
    private readonly httpClient: AxiosRestClient;

    /**
     * Constructs new JWT credentials. The client ID and client secret will be used to retrieve a
     * JWT token from the authentication URL on demand.
     *
     * @param clientId - the client ID
     * @param clientSecret - the client secret
     * @param authenticationUrl - the authentication URL/token endpoint
     * @param httpClient - the HTTP client to use for fetching the token
     */
    constructor(
        clientId: string,
        clientSecret: string,
        authenticationUrl: string,
        httpClient: AxiosRestClient
    ) {
        this.token = undefined;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.authenticationUrl = authenticationUrl;
        this.httpClient = httpClient;
    }

    @loggedRequest({ purpose: "authenticate" })
    private async fetchToken(): Promise<string> {
        LOG.message("info", `Authenticating to: ${this.authenticationUrl}...`);
        const response = await this.httpClient.post<string>(this.authenticationUrl, {
            ["client_id"]: this.clientId,
            ["client_secret"]: this.clientSecret,
        });
        // A JWT token is expected: https://stackoverflow.com/a/74325712
        const jwtRegex = /^[A-Za-z0-9_-]{2,}(?:\.[A-Za-z0-9_-]{2,}){2}$/;
        if (jwtRegex.test(response.data)) {
            LOG.message("debug", "Authentication successful");
            return response.data;
        } else {
            throw new Error("Expected to receive a JWT token, but did not");
        }
    }

    public async getAuthorizationHeader(): Promise<AuthorizationHeader> {
        this.token ??= this.fetchToken();
        return {
            ["Authorization"]: `Bearer ${await this.token}`,
        };
    }

    /**
     * Return the URL to authenticate to.
     *
     * @returns the URL
     */
    public getAuthenticationUrl(): string {
        return this.authenticationUrl;
    }
}
