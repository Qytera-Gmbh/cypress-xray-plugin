import axios, {
    Axios,
    AxiosRequestConfig,
    AxiosResponse,
    InternalAxiosRequestConfig,
    isAxiosError,
} from "axios";
import { readFileSync } from "fs";
import { Agent } from "https";
import { InternalSslOptions } from "../../types/plugin";
import { normalizedFilename } from "../../util/files";
import { LOG, Level } from "../../util/logging";

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
    private axios: Axios | undefined = undefined;

    private options: RequestsOptions | undefined = undefined;

    public init(options: RequestsOptions): void {
        this.options = options;
    }

    public async get<R>(
        url: string,
        config?: AxiosRequestConfig<unknown>
    ): Promise<AxiosResponse<R>> {
        return this.getAxios().get(url, {
            ...config,
            httpsAgent: this.getAgent(),
        });
    }

    public async post<R, D = unknown>(
        url: string,
        data?: D,
        config?: AxiosRequestConfig<D>
    ): Promise<AxiosResponse<R>> {
        return this.getAxios().post(url, data, {
            ...config,
            httpsAgent: this.getAgent(),
        });
    }

    public async put<R, D = unknown>(
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

    private getAxios(): Axios {
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
                        const timestamp = Date.now();
                        const filename = normalizedFilename(
                            `${timestamp}_${method}_${url}_request.json`
                        );
                        const resolvedFilename = LOG.logToFile(
                            JSON.stringify({
                                url: url,
                                headers: request.headers,
                                params: request.params as unknown,
                                body: request.data,
                            }),
                            filename
                        );
                        LOG.message(Level.DEBUG, `Request:  ${resolvedFilename}`);
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
                        const resolvedFilename = LOG.logToFile(JSON.stringify(data), filename);
                        LOG.message(Level.DEBUG, `Request:  ${resolvedFilename}`);
                        return Promise.reject(error);
                    }
                );
                this.axios.interceptors.response.use(
                    (response: AxiosResponse<unknown>) => {
                        const request = response.request as AxiosRequestConfig<unknown>;
                        const method = request.method?.toUpperCase();
                        const url = response.config.url;
                        const timestamp = Date.now();
                        const filename = normalizedFilename(
                            `${timestamp}_${method}_${url}_response.json`
                        );
                        const resolvedFilename = LOG.logToFile(
                            JSON.stringify({
                                data: response.data,
                                headers: response.headers,
                                status: response.status,
                                statusText: response.statusText,
                            }),
                            filename
                        );
                        LOG.message(Level.DEBUG, `Response: ${resolvedFilename}`);
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
                        const resolvedFilename = LOG.logToFile(JSON.stringify(data), filename);
                        LOG.message(Level.DEBUG, `Response: ${resolvedFilename}`);
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
}

export const REST: AxiosRestClient = new AxiosRestClient();
