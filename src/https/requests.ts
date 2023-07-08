import axios, { Axios, AxiosResponse, RawAxiosRequestConfig, isAxiosError } from "axios";
import { readFileSync, writeFileSync } from "fs";
import { Agent } from "https";
import { logDebug } from "../logging/logging";
import { PluginContext } from "../types/plugin";
import { normalizedFilename } from "../util/files";

export class Requests {
    private static AGENT: Agent = undefined;
    private static AXIOS: Axios = undefined;

    private static context: PluginContext = undefined;

    public static init(context: PluginContext): void {
        Requests.context = context;
    }

    private static agent(): Agent {
        if (!Requests.AGENT) {
            Requests.AGENT = new Agent({
                ca: Requests.readCertificate(Requests.context.internal.openSSL.rootCAPath),
                secureOptions: Requests.context.internal.openSSL.secureOptions,
            });
        }
        return Requests.AGENT;
    }

    private static axios(): Axios {
        if (!Requests.AXIOS) {
            Requests.AXIOS = axios;
            if (Requests.context.internal.plugin.debug) {
                Requests.AXIOS.interceptors.request.use(
                    (request) => {
                        const method = request.method.toUpperCase();
                        const url = request.url;
                        const timestamp = Date.now();
                        const filename = normalizedFilename(
                            `${method}_${url}_${timestamp}_request.json`
                        );
                        logDebug(`Writing request to ${filename}.`);
                        writeFileSync(
                            filename,
                            JSON.stringify({
                                url: url,
                                headers: request.headers,
                                params: request.params,
                                body: request.data,
                            })
                        );
                        return request;
                    },
                    (error) => {
                        const timestamp = Date.now();
                        let filename: string;
                        let data: unknown;
                        if (isAxiosError(error)) {
                            const method = error.config.method.toUpperCase();
                            const url = error.config.url;
                            filename = normalizedFilename(
                                `${method}_${url}_${timestamp}_request.json`
                            );
                            data = error.toJSON();
                        } else {
                            filename = normalizedFilename(`request_${timestamp}.json`);
                            data = error;
                        }
                        logDebug(`Writing request to ${filename}.`);
                        writeFileSync(filename, JSON.stringify(data));
                        throw error;
                    }
                );
                Requests.AXIOS.interceptors.response.use(
                    (response) => {
                        const method = response.request.method.toUpperCase();
                        const url = response.config.url;
                        const timestamp = Date.now();
                        const filename = normalizedFilename(
                            `${method}_${url}_${timestamp}_response.json`
                        );
                        logDebug(`Writing response to ${filename}.`);
                        writeFileSync(
                            filename,
                            JSON.stringify({
                                data: response.data,
                                headers: response.headers,
                                status: response.status,
                                statusText: response.statusText,
                            })
                        );
                        return response;
                    },
                    (error) => {
                        const timestamp = Date.now();
                        let filename: string;
                        let data: unknown;
                        if (isAxiosError(error)) {
                            const method = error.config.method.toUpperCase();
                            const url = error.config.url;
                            filename = normalizedFilename(
                                `${method}_${url}_${timestamp}_response.json`
                            );
                            data = error.toJSON();
                        } else {
                            filename = normalizedFilename(`response_${timestamp}.json`);
                            data = error;
                        }
                        logDebug(`Writing response to ${filename}.`);
                        writeFileSync(filename, JSON.stringify(data));
                        throw error;
                    }
                );
            }
        }
        return Requests.AXIOS;
    }

    private static readCertificate(path?: string): Buffer {
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
}
