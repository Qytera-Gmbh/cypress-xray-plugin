import axios, {
    AxiosInstance,
    AxiosRequestConfig,
    AxiosRequestHeaders,
    AxiosResponse,
    InternalAxiosRequestConfig,
    isAxiosError,
} from "axios";
import { normalizedFilename } from "../../util/files";
import { LOG, Level } from "../../util/logging";
import { unknownToString } from "../../util/string";

export interface RequestConfigPost<D = unknown> {
    config?: AxiosRequestConfig<D>;
    data?: D;
    url: string;
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
     * Additional options for controlling HTTP behaviour.
     */
    http?: AxiosRequestConfig;
}

/**
 * Models a request that was logged to a file.
 */
export interface LoggedRequest {
    /**
     * The request's body.
     */
    body: unknown;
    /**
     * The request's headers.
     */
    headers: AxiosRequestHeaders;
    /**
     * The request's parameters.
     */
    params: unknown;
    /**
     * The request's URL.
     */
    url?: string;
}

export class AxiosRestClient {
    private readonly options: RequestsOptions | undefined;

    private axios: AxiosInstance | undefined = undefined;

    constructor(options?: RequestsOptions) {
        this.options = options;
    }

    public async get<R>(
        url: string,
        config?: AxiosRequestConfig<unknown>
    ): Promise<AxiosResponse<R>> {
        return await this.getAxios().get(url, {
            ...this.options?.http,
            ...config,
        });
    }

    public async post<R, D = unknown>(
        url: string,
        data?: D,
        config?: AxiosRequestConfig<D>
    ): Promise<AxiosResponse<R>> {
        return this.getAxios().post(url, data, {
            ...this.options?.http,
            ...config,
        });
    }

    public async put<R, D = unknown>(
        url: string,
        data?: D,
        config?: AxiosRequestConfig<D>
    ): Promise<AxiosResponse<R>> {
        return this.getAxios().put(url, data, {
            ...this.options?.http,
            ...config,
        });
    }

    private getAxios(): AxiosInstance {
        if (!this.axios) {
            this.axios = axios.create();
            if (this.options?.debug) {
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
                        const data: LoggedRequest = {
                            body: request.data,
                            headers: request.headers,
                            params: request.params,
                            url: url,
                        };
                        const resolvedFilename = LOG.logToFile(JSON.stringify(data), filename);
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
                        const resolvedFilename = LOG.logToFile(JSON.stringify(data), filename);
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
                        const resolvedFilename = LOG.logToFile(JSON.stringify(data), filename);
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
}
