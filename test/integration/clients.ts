import { BasicAuthCredentials, JwtCredentials } from "../../src/client/authentication/credentials";
import { Client } from "../../src/client/client";
import { AxiosRestClient } from "../../src/client/https/requests";
import { BaseJiraClient } from "../../src/client/jira/jira-client";
import { XrayClientCloud } from "../../src/client/xray/xray-client-cloud";
import { ServerClient } from "../../src/client/xray/xray-client-server";
import { unknownToString } from "../../src/util/string";

import "dotenv/config";

const HTTP_CLIENT = new AxiosRestClient();

const XRAY_CLIENT_CLOUD = new XrayClientCloud(
    new JwtCredentials(
        getEnv("CYPRESS_XRAY_CLIENT_ID_CLOUD", "XRAY_CLIENT_ID"),
        getEnv("CYPRESS_XRAY_CLIENT_SECRET_CLOUD", "XRAY_CLIENT_SECRET"),
        `${XrayClientCloud.URL}/authenticate`,
        HTTP_CLIENT
    ),
    HTTP_CLIENT
);

const XRAY_CLIENT_SERVER = new ServerClient(
    getEnv("CYPRESS_JIRA_URL_SERVER"),
    new BasicAuthCredentials(
        getEnv("CYPRESS_JIRA_USERNAME_SERVER"),
        getEnv("CYPRESS_JIRA_PASSWORD_SERVER")
    ),
    HTTP_CLIENT
);

const JIRA_CLIENT_CLOUD = new BaseJiraClient(
    getEnv("CYPRESS_JIRA_URL_CLOUD"),
    new BasicAuthCredentials(
        getEnv("CYPRESS_JIRA_USERNAME_CLOUD"),
        getEnv("CYPRESS_JIRA_API_TOKEN_CLOUD")
    ),
    HTTP_CLIENT
);

const JIRA_CLIENT_SERVER = new BaseJiraClient(
    getEnv("CYPRESS_JIRA_URL_SERVER"),
    new BasicAuthCredentials(
        getEnv("CYPRESS_JIRA_USERNAME_SERVER"),
        getEnv("CYPRESS_JIRA_PASSWORD_SERVER")
    ),
    HTTP_CLIENT
);

export function getIntegrationClient<T extends "cloud" | "server">(
    client: "xray",
    service: T
): T extends "cloud" ? XrayClientCloud : ServerClient;
export function getIntegrationClient(client: "jira", service: "cloud" | "server"): BaseJiraClient;
export function getIntegrationClient(client: "jira" | "xray", service: "cloud" | "server"): Client {
    switch (client) {
        case "jira": {
            switch (service) {
                case "cloud":
                    return JIRA_CLIENT_CLOUD;
                case "server":
                    return JIRA_CLIENT_SERVER;
                default:
                    throw new Error(`Unknown service type: ${unknownToString(service)}`);
            }
        }
        case "xray": {
            switch (service) {
                case "cloud":
                    return XRAY_CLIENT_CLOUD;
                case "server":
                    return XRAY_CLIENT_SERVER;
                default:
                    throw new Error(`Unknown service type: ${unknownToString(service)}`);
            }
        }
        default:
            throw new Error(`Unknown client type: ${unknownToString(client)}`);
    }
}

function getEnv(...keys: string[]): string {
    let value: string | undefined;
    for (const key of keys) {
        if (!process.env[key]) {
            continue;
        }
        value = process.env[key];
    }
    if (!value) {
        throw new Error(
            `Failed to find environment variable value for keys: ${JSON.stringify(keys)}`
        );
    }
    return value;
}
