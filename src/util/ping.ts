import { AxiosResponse } from "axios";
import {
    BasicAuthCredentials,
    HTTPHeader,
    JWTCredentials,
    PATCredentials,
} from "../authentication/credentials";
import { XrayClientCloud } from "../client/xray/xrayClientCloud";
import { Requests } from "../https/requests";
import { logDebug, logError, logInfo, writeErrorFile } from "../logging/logging";
import { UserCloud, UserServer } from "../types/jira/responses/user";
import { XrayLicenseStatus } from "../types/xray/responses/license";
import { dedent } from "./dedent";
import { errorMessage } from "./error";
import { startInterval } from "./timer";

/**
 * Pings a Jira instance and verifies that:
 * - the URL is the base URL of a Jira instance
 * - the credentials belong to a valid Jira user
 *
 * @param url the base URL of the Jira instance
 * @param credentials the credentials of a valid Jira user
 * @returns `true` if the instance can be pinged, `false` otherwise
 * @see https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-myself/#api-rest-api-3-myself-get
 * @see https://docs.atlassian.com/software/jira/docs/api/REST/9.11.0/#api/2/myself
 */
export async function pingJiraInstance(
    url: string,
    credentials: BasicAuthCredentials | PATCredentials
): Promise<boolean> {
    logDebug("Pinging Jira instance...");
    const progressInterval = startInterval((totalTime: number) => {
        logInfo(`Waiting for ${url} to respond... (${totalTime / 1000} seconds)`);
    });
    let userResponse: AxiosResponse<UserServer | UserCloud> | undefined = undefined;
    try {
        const header = await credentials.getAuthenticationHeader();
        userResponse = await Requests.get(`${url}/rest/api/latest/myself`, {
            headers: {
                ...header,
            },
        });
        if (userResponse.data.displayName) {
            logDebug(
                dedent(`
                    Successfully established communication with: ${url}
                    The provided Jira credentials belong to: ${userResponse.data.displayName}
                `)
            );
            return true;
        } else {
            throw new Error(
                dedent(`
                    Jira instance did not return a valid response: JSON containing user data was expected, but not received
                `)
            );
        }
    } catch (error: unknown) {
        logError(
            dedent(`
                Failed to establish communication with Jira instance: ${url}

                ${errorMessage(error)}

                Make sure you have correctly set up:
                - Jira base URL: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#url
                - Jira authentication: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/authentication/#jira
            `)
        );
        if (userResponse) {
            writeErrorFile(userResponse.data, "jiraPingResponse");
        }
        return false;
    } finally {
        clearInterval(progressInterval);
    }
}

/**
 * Pings an Xray server instance and verifies that:
 * - the URL is the base URL of an Xray server instance
 * - the credentials belong to a user with a valid Xray license
 *
 * @param url the base URL of the Xray server instance
 * @param credentials the credentials of a user with a valid Xray license
 * @returns `true` if the instance can be pinged, `false` otherwise
 * @see https://docs.getxray.app/display/XRAY/v2.0#/External%20Apps/get_xraylicense
 */
export async function pingXrayServer(
    url: string,
    credentials: BasicAuthCredentials | PATCredentials
): Promise<boolean> {
    logDebug("Pinging Xray server instance...");
    const progressInterval = startInterval((totalTime: number) => {
        logInfo(`Waiting for ${url} to respond... (${totalTime / 1000} seconds)`);
    });
    let licenseResponse: AxiosResponse<XrayLicenseStatus> | undefined = undefined;
    try {
        const header = await credentials.getAuthenticationHeader();
        licenseResponse = await Requests.get(`${url}/rest/raven/latest/api/xraylicense`, {
            headers: {
                ...header,
            },
        });
        if ("active" in licenseResponse.data) {
            if (licenseResponse.data.active) {
                logDebug(
                    dedent(`
                        Successfully established communication with: ${url}
                        Xray license is active: ${licenseResponse.data.licenseType}
                    `)
                );
                return true;
            }
            throw new Error("The Xray license is not active");
        }
        throw new Error(
            dedent(`
                Xray instance did not return a valid response: JSON containing license status data was expected, but not received
            `)
        );
    } catch (error: unknown) {
        logError(
            dedent(`
                Failed to establish communication with Xray server instance: ${url}

                ${errorMessage(error)}

                Make sure you have correctly set up:
                - Jira base URL: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#url
                - Xray server authentication: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/authentication/#xray-server
                - Xray itself: https://docs.getxray.app/display/XRAY/Installation

            `)
        );
        if (licenseResponse) {
            writeErrorFile(licenseResponse.data, "xrayServerPingResponse");
        }
        return false;
    } finally {
        clearInterval(progressInterval);
    }
}

/**
 * Pings Xray cloud and verifies that the credentials belong to a user with a valid Xray license.
 *
 * @returns `true` if the credentials are valid, `false` otherwise
 * @see https://docs.getxray.app/display/XRAYCLOUD/Authentication+-+REST+v2
 */
export async function pingXrayCloud(credentials: JWTCredentials): Promise<boolean> {
    logDebug("Pinging Xray cloud...");
    const progressInterval = startInterval((totalTime: number) => {
        logInfo(`Waiting for ${XrayClientCloud.URL} to respond... (${totalTime / 1000} seconds)`);
    });
    let header: HTTPHeader | undefined = undefined;
    try {
        header = await credentials.getAuthenticationHeader();
        if ("Authorization" in header) {
            logDebug(
                dedent(`
                    Successfully established communication with: ${XrayClientCloud.URL}
                    The provided credentials belong to a user with a valid Xray license
                `)
            );
            return true;
        }
        throw new Error(
            dedent(`
                Xray did not return a valid response: A JWT token was expected, but not granted
            `)
        );
    } catch (error: unknown) {
        logError(
            dedent(`
                Failed to establish communication with: ${XrayClientCloud.URL}

                ${errorMessage(error)}

                Make sure you have correctly set up:
                - Xray cloud authentication: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/authentication/#xray-cloud
                - Xray itself: https://docs.getxray.app/display/XRAYCLOUD/Installation
            `)
        );
        return false;
    } finally {
        clearInterval(progressInterval);
    }
}
