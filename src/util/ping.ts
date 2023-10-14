import {
    BasicAuthCredentials,
    JWTCredentials,
    PATCredentials,
} from "../authentication/credentials";
import { Requests } from "../https/requests";
import { logDebug, logInfo } from "../logging/logging";
import { UserCloud, UserServer } from "../types/jira/responses/user";
import { dedent } from "./dedent";
import { errorMessage } from "./errors";
import { startInterval } from "./time";

/**
 * Pings a Jira instance and verifies that:
 * - the URL is the base URL of a Jira instance
 * - the credentials belong to a valid Jira user
 *
 * @param url - the base URL of the Jira instance
 * @param credentials - the credentials of a valid Jira user
 * @see https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-myself/#api-rest-api-3-myself-get
 * @see https://docs.atlassian.com/software/jira/docs/api/REST/9.11.0/#api/2/myself
 */
export async function pingJiraInstance(
    url: string,
    credentials: BasicAuthCredentials | PATCredentials
): Promise<void> {
    logDebug("Pinging Jira instance...");
    const progressInterval = startInterval((totalTime: number) => {
        logInfo(`Waiting for ${url} to respond... (${totalTime / 1000} seconds)`);
    });
    try {
        const header = await credentials.getAuthenticationHeader();
        const userResponse = await Requests.get(`${url}/rest/api/latest/myself`, {
            headers: {
                ...header,
            },
        });
        const username = getUserString(userResponse.data);
        if (username) {
            logDebug(
                dedent(`
                    Successfully established communication with: ${url}
                    The provided Jira credentials belong to: ${username}
                `)
            );
        } else {
            throw new Error(
                dedent(`
                    Jira did not return a valid response: JSON containing a username was expected, but not received
                `)
            );
        }
    } catch (error: unknown) {
        throw new Error(
            dedent(`
                Failed to establish communication with Jira: ${url}

                ${errorMessage(error)}

                Make sure you have correctly set up:
                - Jira base URL: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#url
                - Jira authentication: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/authentication/#jira

                For more information, set the plugin to debug mode: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/plugin/#debug
            `)
        );
    } finally {
        clearInterval(progressInterval);
    }
}

function getUserString(user: UserServer | UserCloud): string | undefined {
    return user.displayName ?? user.emailAddress ?? user.name;
}

/**
 * Pings an Xray server instance and verifies that:
 * - the URL is the base URL of an Xray server instance
 * - the credentials belong to a user with a valid Xray license
 *
 * @param url - the base URL of the Xray server instance
 * @param credentials - the credentials of a user with a valid Xray license
 * @see https://docs.getxray.app/display/XRAY/v2.0#/External%20Apps/get_xraylicense
 */
export async function pingXrayServer(
    url: string,
    credentials: BasicAuthCredentials | PATCredentials
): Promise<void> {
    logDebug("Pinging Xray server instance...");
    const progressInterval = startInterval((totalTime: number) => {
        logInfo(`Waiting for ${url} to respond... (${totalTime / 1000} seconds)`);
    });
    try {
        const header = await credentials.getAuthenticationHeader();
        const licenseResponse = await Requests.get(`${url}/rest/raven/latest/api/xraylicense`, {
            headers: {
                ...header,
            },
        });
        if (typeof licenseResponse.data === "object" && "active" in licenseResponse.data) {
            if (licenseResponse.data.active) {
                logDebug(
                    dedent(`
                        Successfully established communication with: ${url}
                        Xray license is active: ${licenseResponse.data.licenseType}
                    `)
                );
            } else {
                throw new Error("The Xray license is not active");
            }
        } else {
            throw new Error(
                dedent(`
                    Xray did not return a valid response: JSON containing basic Xray license information was expected, but not received
                `)
            );
        }
    } catch (error: unknown) {
        throw new Error(
            dedent(`
                Failed to establish communication with Xray: ${url}

                ${errorMessage(error)}

                Make sure you have correctly set up:
                - Jira base URL: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#url
                - Xray server authentication: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/authentication/#xray-server
                - Xray itself: https://docs.getxray.app/display/XRAY/Installation

                For more information, set the plugin to debug mode: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/plugin/#debug

            `)
        );
    } finally {
        clearInterval(progressInterval);
    }
}

/**
 * Pings Xray cloud and verifies that the credentials belong to a user with a valid Xray license.
 *
 * @param credentials - Xray cloud credentials
 * @see https://docs.getxray.app/display/XRAYCLOUD/Authentication+-+REST+v2
 */
export async function pingXrayCloud(credentials: JWTCredentials): Promise<void> {
    logDebug("Pinging Xray cloud...");
    try {
        await credentials.getAuthenticationHeader();
        logDebug(
            dedent(`
                Successfully established communication with: ${credentials.getAuthenticationUrl()}
                The provided credentials belong to a user with a valid Xray license
            `)
        );
    } catch (error: unknown) {
        throw new Error(
            dedent(`
                Failed to establish communication with Xray: ${credentials.getAuthenticationUrl()}

                ${errorMessage(error)}

                Make sure you have correctly set up:
                - Xray cloud authentication: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/authentication/#xray-cloud
                - Xray itself: https://docs.getxray.app/display/XRAYCLOUD/Installation

                For more information, set the plugin to debug mode: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/plugin/#debug
            `)
        );
    }
}
