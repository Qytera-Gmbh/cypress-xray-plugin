import { Requests } from "../https/requests";
import { logDebug, logError, logInfo, writeErrorFile } from "../logging/logging";
import { StringMap } from "../types/util";
import { encode } from "../util/base64";
import { dedent } from "../util/dedent";
import { LoggedError, errorMessage } from "../util/errors";
import { startInterval } from "../util/time";

/**
 * A basic HTTP header.
 * @example
 *   { "Authorization": "Bearer xyz" }
 *   { "Content-Type": "application/json" }
 */
export type HTTPHeader = StringMap<string>;

export abstract class APICredentials {
    public abstract getAuthenticationHeader(): Promise<HTTPHeader>;
}

export class BasicAuthCredentials extends APICredentials {
    private readonly username: string;
    private readonly password: string;

    constructor(username: string, password: string) {
        super();
        this.username = username;
        this.password = password;
    }

    public getAuthenticationHeader(): Promise<HTTPHeader> {
        // See: https://developer.atlassian.com/server/jira/platform/basic-authentication/#construct-the-authorization-header
        const encodedString = encode(`${this.username}:${this.password}`);
        return new Promise((resolve: (value: HTTPHeader) => void) =>
            resolve({
                Authorization: `Basic ${encodedString}`,
            })
        );
    }
}

export class PATCredentials extends APICredentials {
    private readonly token: string;

    constructor(token: string) {
        super();
        this.token = token;
    }

    public getAuthenticationHeader(): Promise<HTTPHeader> {
        return new Promise((resolve: (value: HTTPHeader) => void) =>
            resolve({
                Authorization: `Bearer ${this.token}`,
            })
        );
    }
}
export interface JWTCredentialsOptions {
    authenticationURL: string;
}

export class JWTCredentials extends APICredentials {
    private readonly clientId: string;
    private readonly clientSecret: string;
    private readonly authenticationUrl: string;

    private token?: string;

    constructor(clientId: string, clientSecret: string, authenticationUrl: string) {
        super();
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.authenticationUrl = authenticationUrl;
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
                    logInfo(
                        `Waiting for ${this.authenticationUrl} to respond... (${
                            totalTime / 1000
                        } seconds)`
                    );
                });
                try {
                    logInfo(`Authenticating to: ${this.authenticationUrl}...`);
                    const tokenResponse = await Requests.post(this.authenticationUrl, {
                        client_id: this.clientId,
                        client_secret: this.clientSecret,
                    });
                    // A JWT token is expected: https://stackoverflow.com/a/74325712
                    const jwtRegex = /^[A-Za-z0-9_-]{2,}(?:\.[A-Za-z0-9_-]{2,}){2}$/;
                    if (jwtRegex.test(tokenResponse.data)) {
                        logDebug("Authentication successful.");
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
                logError(
                    dedent(`
                        Failed to authenticate to: ${this.authenticationUrl}

                        ${message}
                    `)
                );
                writeErrorFile(error, "authentication");
                throw new LoggedError("Authentication failed");
            }
        }
        return this.token;
    }

    public async getAuthenticationHeader(): Promise<HTTPHeader> {
        return {
            Authorization: `Bearer ${await this.getToken()}`,
        };
    }
}
