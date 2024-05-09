import { AxiosResponse } from "axios";
import {
    BasicAuthCredentials,
    JwtCredentials,
    PatCredentials,
} from "../authentication/credentials";
import { AxiosRestClient } from "../https/requests";
import { LOG, Level } from "../logging/logging";
import { User } from "../types/jira/responses/user";
import { XrayLicenseStatus } from "../types/xray/responses/license";
import { dedent } from "./dedent";
import { errorMessage } from "./errors";
import { HELP } from "./help";
import { startInterval } from "./time";

/**
 * Pings a Jira instance and verifies that:
 * - the URL is the base URL of a Jira instance
 * - the credentials belong to a valid Jira user
 *
 * @param url - the base URL of the Jira instance
 * @param credentials - the credentials of a valid Jira user
 * @param httpClient - the HTTP client to use to dispatch the ping
 * @see https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-myself/#api-rest-api-3-myself-get
 * @see https://docs.atlassian.com/software/jira/docs/api/REST/9.11.0/#api/2/myself
 */
export async function pingJiraInstance(
    url: string,
    credentials: BasicAuthCredentials | PatCredentials,
    httpClient: AxiosRestClient
): Promise<void> {
    LOG.message(Level.DEBUG, "Pinging Jira instance...");
    const progressInterval = startInterval((totalTime: number) => {
        LOG.message(
            Level.INFO,
            `Waiting for ${url} to respond... (${(totalTime / 1000).toString()} seconds)`
        );
    });
    try {
        const header = credentials.getAuthorizationHeader();
        const userResponse: AxiosResponse<User> = await httpClient.get(
            `${url}/rest/api/latest/myself`,
            {
                headers: {
                    ...header,
                },
            }
        );
        const username = getUserString(userResponse.data);
        if (username) {
            LOG.message(
                Level.DEBUG,
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
                - Jira base URL: ${HELP.plugin.configuration.jira.url}
                - Jira authentication: ${HELP.plugin.configuration.authentication.jira.root}

                For more information, set the plugin to debug mode: ${
                    HELP.plugin.configuration.plugin.debug
                }
            `)
        );
    } finally {
        clearInterval(progressInterval);
    }
}

function getUserString(user: User): string | undefined {
    return user.displayName ?? user.emailAddress ?? user.name;
}

/**
 * Pings an Xray server instance and verifies that:
 * - the URL is the base URL of an Xray server instance
 * - the credentials belong to a user with a valid Xray license
 *
 * @param url - the base URL of the Xray server instance
 * @param credentials - the credentials of a user with a valid Xray license
 * @param httpClient - the HTTP client to use to dispatch the ping
 * @see https://docs.getxray.app/display/XRAY/v2.0#/External%20Apps/get_xraylicense
 */
export async function pingXrayServer(
    url: string,
    credentials: BasicAuthCredentials | PatCredentials,
    httpClient: AxiosRestClient
): Promise<void> {
    LOG.message(Level.DEBUG, "Pinging Xray server instance...");
    const progressInterval = startInterval((totalTime: number) => {
        LOG.message(
            Level.INFO,
            `Waiting for ${url} to respond... (${(totalTime / 1000).toString()} seconds)`
        );
    });
    try {
        const header = credentials.getAuthorizationHeader();
        const licenseResponse: AxiosResponse<XrayLicenseStatus> = await httpClient.get(
            `${url}/rest/raven/latest/api/xraylicense`,
            {
                headers: {
                    ...header,
                },
            }
        );
        if (typeof licenseResponse.data === "object" && "active" in licenseResponse.data) {
            if (licenseResponse.data.active) {
                LOG.message(
                    Level.DEBUG,
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
                - Jira base URL: ${HELP.plugin.configuration.jira.url}
                - Xray server authentication: ${
                    HELP.plugin.configuration.authentication.xray.server
                }
                - Xray itself: ${HELP.xray.installation.server}

                For more information, set the plugin to debug mode: ${
                    HELP.plugin.configuration.plugin.debug
                }

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
export async function pingXrayCloud(credentials: JwtCredentials): Promise<void> {
    LOG.message(Level.DEBUG, "Pinging Xray cloud...");
    try {
        await credentials.getAuthorizationHeader();
        LOG.message(
            Level.DEBUG,
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
                - Xray cloud authentication: ${HELP.plugin.configuration.authentication.xray.cloud}
                - Xray itself: ${HELP.xray.installation.cloud}

                For more information, set the plugin to debug mode: ${
                    HELP.plugin.configuration.plugin.debug
                }
            `)
        );
    }
}
