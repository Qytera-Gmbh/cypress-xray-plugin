import axios, { AxiosResponse, RawAxiosRequestConfig } from "axios";
import { readFileSync, writeFileSync } from "fs";
import { Agent } from "https";
import { CONTEXT } from "../context";
import { logDebug } from "../logging/logging";
import { normalizedFilename } from "../util/files";

type Method = "GET" | "POST";

export class Requests {
    private static AGENT: Agent = undefined;

    private static agent(): Agent {
        if (!Requests.AGENT) {
            Requests.AGENT = new Agent({
                ca: Requests.readCertificate(CONTEXT.config.openSSL.rootCAPath),
                secureOptions: CONTEXT.config.openSSL.secureOptions,
            });
        }
        return Requests.AGENT;
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
        if (!CONTEXT.config.plugin.debug) {
            return axios.get(url, {
                ...config,
                httpsAgent: Requests.agent(),
            });
        }
        const timestamp = Date.now();
        this.logRequest("GET", url, timestamp, null, config);
        const response = await axios.get(url, {
            ...config,
            httpsAgent: Requests.agent(),
        });
        this.logResponse("GET", url, timestamp, response);
        return response;
    }

    public static async post<D = unknown>(
        url: string,
        data?: D,
        config?: RawAxiosRequestConfig<D>
    ): Promise<AxiosResponse> {
        if (!CONTEXT.config.plugin.debug) {
            return axios.post(url, data, {
                ...config,
                httpsAgent: Requests.agent(),
            });
        }
        const timestamp = Date.now();
        this.logRequest("POST", url, timestamp, data, config);
        const response = await axios.post(url, data, {
            ...config,
            httpsAgent: Requests.agent(),
        });
        this.logResponse("POST", url, timestamp, response);
        return response;
    }

    // Debug utilities.

    private static logRequest<D>(
        method: Method,
        url: string,
        timestamp: number,
        data: D | null,
        config?: RawAxiosRequestConfig<D>
    ) {
        const filename = normalizedFilename(`${method}_${url}_${timestamp}`);
        logDebug(`Writing ${method} request data to ${filename}_request.json.`);
        if (data) {
            writeFileSync(
                `${filename}_request.json`,
                JSON.stringify({
                    url: url,
                    body: data,
                    config: config,
                })
            );
        } else {
            writeFileSync(
                `${filename}_request.json`,
                JSON.stringify({
                    url: url,
                    config: config,
                })
            );
        }
    }

    private static logResponse(
        method: Method,
        url: string,
        timestamp: number,
        response: AxiosResponse
    ) {
        const filename = normalizedFilename(`${method}_${url}_${timestamp}`);
        logDebug(`Writing ${method} response data to ${filename}_response.json.`);
        writeFileSync(
            `${filename}_response.json`,
            JSON.stringify({
                data: response.data,
                headers: response.headers,
                status: response.status,
                statusText: response.statusText,
            })
        );
    }
}
