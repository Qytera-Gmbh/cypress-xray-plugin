import { AxiosResponse } from "axios";
import { Requests } from "../https/requests";
import { logDebug, logInfo } from "../logging/logging";
import { StringMap } from "../types/util";
import { encode } from "../util/base64";

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

    private async getToken(): Promise<string> {
        if (!this.token) {
            logInfo(`Authenticating to: ${this.authenticationUrl}...`);
            const response: AxiosResponse<string> = await Requests.post(this.authenticationUrl, {
                client_id: this.clientId,
                client_secret: this.clientSecret,
            });
            logDebug("Authentication successful.");
            this.token = response.data;
            return this.token;
        }
        return this.token;
    }

    public async getAuthenticationHeader(): Promise<HTTPHeader> {
        return {
            Authorization: `Bearer ${await this.getToken()}`,
        };
    }
}
