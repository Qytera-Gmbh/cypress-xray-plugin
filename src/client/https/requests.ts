import axios, {
    AxiosInstance,
    AxiosRequestConfig,
    AxiosRequestHeaders,
    AxiosResponse,
    InternalAxiosRequestConfig,
    isAxiosError,
} from "axios";
import FormData from "form-data";
import { normalizedFilename } from "../../util/files";
import { LOG, Level } from "../../util/logging";
import { unknownToString } from "../../util/string";
import { startInterval } from "../../util/time";

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
        const progressInterval = this.startResponseInterval(url);
        try {
            return await this.getAxios().get(url, {
                ...this.options?.http,
                ...config,
            });
        } finally {
            clearInterval(progressInterval);
        }
    }

    public async post<R, D = unknown>(
        url: string,
        data?: D,
        config?: AxiosRequestConfig<D>
    ): Promise<AxiosResponse<R>> {
        const progressInterval = this.startResponseInterval(url);
        try {
            return await this.getAxios().post(url, data, {
                ...this.options?.http,
                ...config,
            });
        } finally {
            clearInterval(progressInterval);
        }
    }

    public async put<R, D = unknown>(
        url: string,
        data?: D,
        config?: AxiosRequestConfig<D>
    ): Promise<AxiosResponse<R>> {
        const progressInterval = this.startResponseInterval(url);
        try {
            return await this.getAxios().put(url, data, {
                ...this.options?.http,
                ...config,
            });
        } finally {
            clearInterval(progressInterval);
        }
    }

    private getAxios(): AxiosInstance {
        if (!this.axios) {
            this.axios = axios.create();
            if (this.options?.debug) {
                this.axios.interceptors.request.use(
                    (request: InternalAxiosRequestConfig<unknown>) => {
                        this.logRequest(request);
                        return request;
                    }
                );
                this.axios.interceptors.response.use((response: AxiosResponse<unknown>) => {
                    this.logResponse(response);
                    return response;
                });
            }
            this.axios.interceptors.request.use(
                (request: InternalAxiosRequestConfig<unknown>) => request,
                (error: unknown) => {
                    this.logError("outbound", error);
                    return Promise.reject(
                        error instanceof Error ? error : new Error(unknownToString(error))
                    );
                }
            );
            this.axios.interceptors.response.use(
                (response: AxiosResponse<unknown>) => response,
                (error: unknown) => {
                    this.logError("inbound", error);
                    return Promise.reject(
                        error instanceof Error ? error : new Error(unknownToString(error))
                    );
                }
            );
        }
        return this.axios;
    }

    private logRequest(request: InternalAxiosRequestConfig<unknown>): void {
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
        if (request.data instanceof FormData) {
            const formData = request.data;
            const chunks: string[] = [];
            formData.on("data", (chunk) => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                chunks.push(Buffer.from(chunk).toString("utf-8"));
            });
            formData.on("end", () => {
                const data: LoggedRequest = {
                    body: chunks.join(""),
                    headers: request.headers,
                    params: request.params,
                    url: url,
                };
                const resolvedFilename = LOG.logToFile(JSON.stringify(data, null, 2), filename);
                LOG.message(Level.DEBUG, `Request:  ${resolvedFilename}`);
            });
            formData.on("error", (error) => {
                throw error;
            });
        } else {
            const data: LoggedRequest = {
                body: request.data,
                headers: request.headers,
                params: request.params,
                url: url,
            };
            const resolvedFilename = LOG.logToFile(JSON.stringify(data, null, 2), filename);
            LOG.message(Level.DEBUG, `Request:  ${resolvedFilename}`);
        }
    }

    private logResponse(response: AxiosResponse<unknown>): void {
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
            JSON.stringify(
                {
                    data: response.data,
                    headers: response.headers,
                    status: response.status,
                    statusText: response.statusText,
                },
                null,
                2
            ),
            filename
        );
        LOG.message(Level.DEBUG, `Response: ${resolvedFilename}`);
    }

    private logError(direction: "inbound" | "outbound", error: unknown): void {
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
        const filename = normalizedFilename(
            `${prefix}_${direction === "inbound" ? "response" : "request"}.json`
        );
        const resolvedFilename = LOG.logToFile(JSON.stringify(data), filename);
        LOG.message(
            Level.DEBUG,
            `${direction === "inbound" ? "Response" : "Request"}: ${resolvedFilename}`
        );
    }

    private startResponseInterval(url: string): ReturnType<typeof setInterval> {
        return startInterval((totalTime: number) => {
            LOG.message(
                Level.INFO,
                `Waiting for ${url} to respond... (${(totalTime / 1000).toString()} seconds)`
            );
        });
    }
}
