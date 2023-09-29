import axios, { Axios, AxiosResponse, RawAxiosRequestConfig, isAxiosError } from "axios";
import { readFileSync } from "fs";
import { Agent } from "https";
import { logDebug, writeFile } from "../logging/logging";
import { InternalOptions } from "../types/plugin";
import { normalizedFilename } from "../util/files";

export type RequestConfigPost<D = unknown> = {
    url: string;
    data?: D;
    config?: RawAxiosRequestConfig<D>;
};

export class Requests {
    private static AGENT: Agent | undefined = undefined;
    private static AXIOS: Axios | undefined = undefined;

    private static options: InternalOptions | undefined = undefined;

    public static init(options: InternalOptions): void {
        Requests.options = options;
    }

    private static agent(): Agent {
        if (!Requests.AGENT) {
            Requests.AGENT = new Agent({
                ca: Requests.readCertificate(Requests.options?.openSSL.rootCAPath),
                secureOptions: Requests.options?.openSSL.secureOptions,
            });
        }
        return Requests.AGENT;
    }

    private static axios(): Axios {
        if (!Requests.options) {
            throw new Error("Requests module has not been initialized");
        }
        if (!Requests.AXIOS) {
            Requests.AXIOS = axios;
            if (Requests.options.plugin.debug) {
                Requests.AXIOS.interceptors.request.use(
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
                Requests.AXIOS.interceptors.response.use(
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
        return Requests.AXIOS;
    }

    private static readCertificate(path?: string): Buffer | undefined {
        if (!path) {
            return undefined;
        }
        return readFileSync(path);
    }

    public static async get(
        url: string,
        config?: RawAxiosRequestConfig<undefined>
    ): Promise<AxiosResponse> {
        return Requests.axios().get(url, {
            ...config,
            httpsAgent: Requests.agent(),
        });
    }

    public static async post<D = unknown>(
        url: string,
        data?: D,
        config?: RawAxiosRequestConfig<D>
    ): Promise<AxiosResponse> {
        return Requests.axios().post(url, data, {
            ...config,
            httpsAgent: Requests.agent(),
        });
    }

    public static async put<D = unknown>(
        url: string,
        data?: D,
        config?: RawAxiosRequestConfig<D>
    ): Promise<AxiosResponse> {
        return Requests.axios().put(url, data, {
            ...config,
            httpsAgent: Requests.agent(),
        });
    }
}
