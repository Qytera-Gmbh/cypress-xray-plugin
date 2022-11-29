import axios, { AxiosError, AxiosResponse } from "axios";
import { encode } from "./util/base64";

/**
 * A basic HTTP header.
 * @example
 *   { "Authorization": "Bearer xyz" }
 *   { "Content-Type": "application/json" }
 */
export interface HTTPHeader {
    [key: string]: string;
}

export interface APICredentialsOptions {}

export abstract class APICredentials<O extends APICredentialsOptions> {
    public abstract getAuthenticationHeader(options?: O): Promise<HTTPHeader>;
}

export class BasicAuthCredentials extends APICredentials<APICredentialsOptions> {
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

export class PATCredentials extends APICredentials<APICredentialsOptions> {
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
export interface JWTCredentialsOptions extends APICredentialsOptions {
    authenticationURL: string;
}

export class JWTCredentials extends APICredentials<JWTCredentialsOptions> {
    private readonly clientId: string;
    private readonly clientSecret: string;

    private token?: string;

    constructor(clientId: string, clientSecret: string) {
        super();
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.token = undefined;
    }

    private async getToken(authenticationURL: string): Promise<string> {
        if (!this.token) {
            console.log(`Authenticating against: ${authenticationURL}...`);
            return axios
                .post(authenticationURL, {
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                })
                .then((response: AxiosResponse) => {
                    console.log("\tAuthentication successful.");
                    this.token = response.data;
                    return this.token;
                })
                .catch((error: AxiosError) => {
                    throw new Error(`\tAuthentication failure: ${error}`);
                });
        }
        return this.token;
    }

    public async getAuthenticationHeader(
        options: JWTCredentialsOptions
    ): Promise<HTTPHeader> {
        const token = await this.getToken(options.authenticationURL);
        return {
            Authorization: `Bearer ${token}`,
        };
    }
}
