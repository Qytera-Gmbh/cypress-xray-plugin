import axios, { AxiosResponse, RawAxiosRequestConfig } from "axios";
import { readFileSync, writeFileSync } from "fs";
import { Agent } from "https";
import { CONTEXT } from "../context";
import { logInfo } from "../logging/logging";

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

    public static get(
        url: string,
        config?: RawAxiosRequestConfig<undefined>
    ): Promise<AxiosResponse> {
        return axios.get(url, {
            ...config,
            httpsAgent: Requests.agent(),
        });
    }

    public static post<D = any>(
        url: string,
        data?: D,
        config?: RawAxiosRequestConfig<D>
    ): Promise<AxiosResponse> {
        if (CONTEXT.config.plugin.debug) {
            logInfo("Writing POST request data to post.json.");
            writeFileSync(
                "post.json",
                JSON.stringify({
                    url: url,
                    body: data,
                    config: config,
                })
            );
        }
        return axios.post(url, data, {
            ...config,
            httpsAgent: Requests.agent(),
        });
    }
}
