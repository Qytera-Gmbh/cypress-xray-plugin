import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { readFileSync } from "fs";
import { Agent } from "https";
import {
    ENV_OPENSSL_ROOT_CA_PATH,
    ENV_OPENSSL_SECURE_OPTIONS,
} from "../constants";
import { UploadContext } from "../context";

export class Requests {
    private static AGENT: Agent = undefined;

    private static agent(): Agent {
        if (!Requests.AGENT) {
            Requests.AGENT = new Agent({
                ca:
                    ENV_OPENSSL_ROOT_CA_PATH in UploadContext.ENV
                        ? Requests.readCertificate(
                              UploadContext.ENV[ENV_OPENSSL_ROOT_CA_PATH]
                          )
                        : undefined,
                secureOptions:
                    ENV_OPENSSL_SECURE_OPTIONS in UploadContext.ENV
                        ? UploadContext.ENV[ENV_OPENSSL_SECURE_OPTIONS]
                        : undefined,
            });
        }
        return Requests.AGENT;
    }

    private static readCertificate(path: string): Buffer {
        return readFileSync(path);
    }

    public static get(
        url: string,
        config?: AxiosRequestConfig
    ): Promise<AxiosResponse> {
        return axios.get(url, {
            ...config,
            httpsAgent: Requests.agent(),
        });
    }

    public static post(
        url: string,
        data?: any,
        config?: AxiosRequestConfig
    ): Promise<AxiosResponse> {
        return axios.post(url, data, {
            ...config,
            httpsAgent: Requests.agent(),
        });
    }
}
