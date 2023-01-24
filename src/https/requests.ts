import axios, { AxiosResponse, RawAxiosRequestConfig } from "axios";
import { readFileSync } from "fs";
import { Agent } from "https";
import { PLUGIN_CONTEXT } from "../context";

export class Requests {
    private static AGENT: Agent = undefined;

    private static agent(): Agent {
        if (!Requests.AGENT) {
            Requests.AGENT = new Agent({
                ca: PLUGIN_CONTEXT.openSSL.rootCA
                    ? Requests.readCertificate(PLUGIN_CONTEXT.openSSL.rootCA)
                    : undefined,
                secureOptions: PLUGIN_CONTEXT.openSSL.secureOptions,
            });
        }
        return Requests.AGENT;
    }

    private static readCertificate(path: string): Buffer {
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
        return axios.post(url, data, {
            ...config,
            httpsAgent: Requests.agent(),
        });
    }
}
