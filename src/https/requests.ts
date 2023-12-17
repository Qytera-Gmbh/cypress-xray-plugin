import axios, { Axios, AxiosRequestConfig, AxiosResponse, isAxiosError } from "axios";
import { readFileSync } from "fs";
import { Agent } from "https";
import { logDebug, writeFile } from "../logging/logging";
import { InternalOpenSSLOptions } from "../types/plugin";
import { normalizedFilename } from "../util/files";

export type RequestConfigPost<D = unknown> = {
    url: string;
    data?: D;
    config?: AxiosRequestConfig<D>;
};

/**
 * Options which affect the way the requests module works.
 */
export interface RequestsOptions {
    /**
     * Turns on or off extensive debugging output.
     */
    debug?: boolean;
    /**
     * Additional OpenSSL options for the underlying HTTP agent.
     */
    openSSL?: InternalOpenSSLOptions;
}

export class AxiosRestClient {
    private httpAgent: Agent | undefined = undefined;
    private axios: Axios | undefined = undefined;

    private options: RequestsOptions | undefined = undefined;

    public init(options: RequestsOptions): void {
        this.options = options;
    }

    private getAgent(): Agent {
        if (!this.httpAgent) {
            this.httpAgent = new Agent({
                ca: this.readCertificate(this.options?.openSSL?.rootCAPath),
                secureOptions: this.options?.openSSL?.secureOptions,
            });
        }
        return this.httpAgent;
    }

    private getAxios(): Axios {
        if (!this.options) {
            throw new Error("Requests module has not been initialized");
        }
        if (!this.axios) {
            this.axios = axios;
            if (this.options.debug) {
                this.axios.interceptors.request.use(
                    (request) => {
                        const method = request.method?.toUpperCase();
                        const url = request.url;
                        const timestamp = Date.now();
                        const filename = normalizedFilename(
                            `${timestamp}_${method}_${url}_request.json`
                        );
                        const resolvedFilename = writeFile(
                            {
                                url: url,
                                headers: request.headers,
                                params: request.params,
                                body: request.data,
                            },
                            filename
                        );
                        logDebug(`Request:  ${resolvedFilename}`);
                        return request;
                    },
                    (error) => {
                        const timestamp = Date.now();
                        let filename: string;
                        let data: unknown;
                        if (isAxiosError(error)) {
                            const method = error.config?.method?.toUpperCase();
                            const url = error.config?.url;
                            filename = normalizedFilename(
                                `${timestamp}_${method}_${url}_request.json`
                            );
                            data = error.toJSON();
                        } else {
                            filename = normalizedFilename(`${timestamp}_request.json`);
                            data = error;
                        }
                        const resolvedFilename = writeFile(data, filename);
                        logDebug(`Request:  ${resolvedFilename}`);
                        return Promise.reject(error);
                    }
                );
                this.axios.interceptors.response.use(
                    (response) => {
                        const method = response.request.method.toUpperCase();
                        const url = response.config.url;
                        const timestamp = Date.now();
                        const filename = normalizedFilename(
                            `${timestamp}_${method}_${url}_response.json`
                        );
                        const resolvedFilename = writeFile(
                            {
                                data: response.data,
                                headers: response.headers,
                                status: response.status,
                                statusText: response.statusText,
                            },
                            filename
                        );
                        logDebug(`Response: ${resolvedFilename}`);
                        return response;
                    },
                    (error) => {
                        const timestamp = Date.now();
                        let filename: string;
                        let data: unknown;
                        if (isAxiosError(error)) {
                            const method = error.config?.method?.toUpperCase();
                            const url = error.config?.url;
                            filename = normalizedFilename(
                                `${timestamp}_${method}_${url}_response.json`
                            );
                            data = error.toJSON();
                        } else {
                            filename = normalizedFilename(`${timestamp}_response.json`);
                            data = error;
                        }
                        const resolvedFilename = writeFile(data, filename);
                        logDebug(`Response: ${resolvedFilename}`);
                        return Promise.reject(error);
                    }
                );
            }
        }
        return this.axios;
    }

    private readCertificate(path?: string): Buffer | undefined {
        if (!path) {
            return undefined;
        }
        return readFileSync(path);
    }

    public async get(url: string, config?: AxiosRequestConfig<undefined>): Promise<AxiosResponse> {
        return this.getAxios().get(url, {
            ...config,
            httpsAgent: this.getAgent(),
        });
    }

    public async post<D>(
        url: string,
        data?: D,
        config?: AxiosRequestConfig<D>
    ): Promise<AxiosResponse> {
        return this.getAxios().post(url, data, {
            ...config,
            httpsAgent: this.getAgent(),
        });
    }

    public async put<D>(
        url: string,
        data?: D,
        config?: AxiosRequestConfig<D>
    ): Promise<AxiosResponse> {
        return this.getAxios().put(url, data, {
            ...config,
            httpsAgent: this.getAgent(),
        });
    }
}

export const REST: AxiosRestClient = new AxiosRestClient();
