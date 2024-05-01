import axios, {
    AxiosRequestConfig,
    AxiosResponse,
    InternalAxiosRequestConfig,
    isAxiosError,
} from "axios";
import { readFileSync } from "fs";
import { Agent } from "https";
import { LOG, Level } from "../logging/logging";
import { InternalSslOptions } from "../types/plugin";
import { normalizedFilename } from "../util/files";
import { unknownToString } from "../util/string";

export interface RequestConfigPost<D = unknown> {
    url: string;
    data?: D;
    config?: AxiosRequestConfig<D>;
}

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
    ssl?: InternalSslOptions;
}

export class AxiosRestClient {
    private httpAgent: Agent | undefined = undefined;
    private axios: typeof axios | undefined = undefined;

    private options: RequestsOptions | undefined = undefined;

    public init(options: RequestsOptions): void {
        this.options = options;
    }

    public async get<R>(
        url: string,
        config?: AxiosRequestConfig<unknown>
    ): Promise<AxiosResponse<R>> {
        return await this.getAxios().get(url, {
            ...config,
            httpsAgent: this.getAgent(),
        });
    }

    public async post<D, R>(
        url: string,
        data?: D,
        config?: AxiosRequestConfig<D>
    ): Promise<AxiosResponse<R>> {
        return this.getAxios().post(url, data, {
            ...config,
            httpsAgent: this.getAgent(),
        });
    }

    public async put<D, R>(
        url: string,
        data?: D,
        config?: AxiosRequestConfig<D>
    ): Promise<AxiosResponse<R>> {
        return this.getAxios().put(url, data, {
            ...config,
            httpsAgent: this.getAgent(),
        });
    }

    private getAgent(): Agent {
        if (!this.httpAgent) {
            this.httpAgent = new Agent({
                ca: this.readCertificate(this.options?.ssl?.rootCAPath),
                secureOptions: this.options?.ssl?.secureOptions,
            });
        }
        return this.httpAgent;
    }

    private getAxios(): typeof axios {
        if (!this.options) {
            throw new Error("Requests module has not been initialized");
        }
        if (!this.axios) {
            this.axios = axios;
            if (this.options.debug) {
                this.axios.interceptors.request.use(
                    (request: InternalAxiosRequestConfig<unknown>) => {
                        const method = request.method?.toUpperCase();
                        const url = request.url;
                        let prefix = Date.now().toString();
                        if (method) {
                            prefix = `${prefix}_${method}`;
                        }
                        if (url) {
                            prefix = `${prefix}_${url}`;
                        }
                        const filename = normalizedFilename(`${prefix}_request.json`);
                        const data = {
                            url: url,
                            headers: request.headers,
                            params: request.params as unknown,
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                            body: request.data,
                        };
                        const resolvedFilename = LOG.logToFile(data, filename);
                        LOG.message(Level.DEBUG, `Request:  ${resolvedFilename}`);
                        return request;
                    },
                    (error: unknown) => {
                        let data: unknown;
                        let prefix = Date.now().toString();
                        if (isAxiosError(error)) {
                            const method = error.config?.method?.toUpperCase();
                            const url = error.config?.url;
                            if (method) {
                                prefix = `${prefix}_${method}`;
                            }
                            if (url) {
                                prefix = `${prefix}_${url}`;
                            }
                            data = error.toJSON();
                        } else {
                            data = error;
                        }
                        const filename = normalizedFilename(`${prefix}_request.json`);
                        const resolvedFilename = LOG.logToFile(data, filename);
                        LOG.message(Level.DEBUG, `Request:  ${resolvedFilename}`);
                        return Promise.reject(
                            error instanceof Error ? error : new Error(unknownToString(error))
                        );
                    }
                );
                this.axios.interceptors.response.use(
                    (response: AxiosResponse<unknown>) => {
                        const request = response.request as AxiosRequestConfig<unknown>;
                        const method = request.method?.toUpperCase();
                        const url = response.config.url;
                        const timestamp = Date.now();
                        let prefix = timestamp.toString();
                        if (method) {
                            prefix = `${prefix}_${method}`;
                        }
                        if (url) {
                            prefix = `${prefix}_${url}`;
                        }
                        const filename = normalizedFilename(`${prefix}_response.json`);
                        const resolvedFilename = LOG.logToFile(
                            {
                                data: response.data,
                                headers: response.headers,
                                status: response.status,
                                statusText: response.statusText,
                            },
                            filename
                        );
                        LOG.message(Level.DEBUG, `Response: ${resolvedFilename}`);
                        return response;
                    },
                    (error: unknown) => {
                        let data: unknown;
                        let prefix = Date.now().toString();
                        if (isAxiosError(error)) {
                            const method = error.config?.method?.toUpperCase();
                            const url = error.config?.url;
                            if (method) {
                                prefix = `${prefix}_${method}`;
                            }
                            if (url) {
                                prefix = `${prefix}_${url}`;
                            }
                            data = error.toJSON();
                        } else {
                            data = error;
                        }
                        const filename = normalizedFilename(`${prefix}_response.json`);
                        const resolvedFilename = LOG.logToFile(data, filename);
                        LOG.message(Level.DEBUG, `Response: ${resolvedFilename}`);
                        return Promise.reject(
                            error instanceof Error ? error : new Error(unknownToString(error))
                        );
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
}

export const REST: AxiosRestClient = new AxiosRestClient();
