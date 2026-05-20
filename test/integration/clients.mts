import { XrayClientCloud, XrayClientServer } from "@qytera/xray-client";
import { Version2Client, Version3Client } from "jira.js";

import "dotenv/config";

export const XRAY_CLIENT_CLOUD = new XrayClientCloud({
    credentials: {
        clientId: getEnv("CYPRESS_XRAY_CLIENT_ID_CLOUD", "XRAY_CLIENT_ID"),
        clientSecret: getEnv("CYPRESS_XRAY_CLIENT_SECRET_CLOUD", "XRAY_CLIENT_SECRET"),
        path: "/api/v2/authenticate",
    },
    url: "https://xray.cloud.getxray.app",
});

export const XRAY_CLIENT_SERVER = new XrayClientServer({
    credentials: {
        password: getEnv("CYPRESS_JIRA_PASSWORD_SERVER"),
        username: getEnv("CYPRESS_JIRA_USERNAME_SERVER"),
    },
    url: getEnv("CYPRESS_JIRA_URL_SERVER"),
});

export const JIRA_CLIENT_CLOUD = new Version3Client({
    authentication: {
        basic: {
            apiToken: getEnv("CYPRESS_JIRA_API_TOKEN_CLOUD"),
            email: getEnv("CYPRESS_JIRA_USERNAME_CLOUD"),
        },
    },
    host: getEnv("CYPRESS_JIRA_URL_CLOUD"),
});

export const JIRA_CLIENT_SERVER = new Version2Client({
    authentication: {
        basic: {
            apiToken: getEnv("CYPRESS_JIRA_PASSWORD_SERVER"),
            email: getEnv("CYPRESS_JIRA_USERNAME_SERVER"),
        },
    },
    host: getEnv("CYPRESS_JIRA_URL_SERVER"),
});

export function getIntegrationClient<T extends "cloud" | "server">(
    client: "xray",
    service: T
): T extends "cloud" ? XrayClientCloud : XrayClientServer;
export function getIntegrationClient<T extends "cloud" | "server">(
    client: "jira",
    service: T
): T extends "cloud" ? Version3Client : Version2Client;
export function getIntegrationClient(client: "jira" | "xray", service: "cloud" | "server") {
    switch (client) {
        case "jira": {
            switch (service) {
                case "cloud":
                    return JIRA_CLIENT_CLOUD;
                case "server":
                    return JIRA_CLIENT_SERVER;
                default:
                    throw new Error("Unknown service type");
            }
        }
        case "xray": {
            switch (service) {
                case "cloud":
                    return XRAY_CLIENT_CLOUD;
                case "server":
                    return XRAY_CLIENT_SERVER;
                default:
                    throw new Error("Unknown service type");
            }
        }
        default:
            throw new Error("Unknown client type");
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
