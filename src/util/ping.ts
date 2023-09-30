import { AxiosResponse } from "axios";
import { BasicAuthCredentials, PATCredentials } from "../authentication/credentials";
import { Requests } from "../https/requests";
import { logDebug, logError, logInfo, writeErrorFile } from "../logging/logging";
import { UserCloud, UserServer } from "../types/jira/responses/user";
import { dedent } from "./dedent";
import { errorMessage } from "./error";
import { startInterval } from "./timer";

/**
 * Pings a Jira instance and verifies that:
 * - the URL is the base URL of a Jira instance
 * - the credentials belong to a valid user
 *
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
                    The provided credentials belong to: ${userResponse.data.displayName}
                `)
            );
            return true;
        } else {
            throw new Error(
                dedent(`
                    The Jira instance could be accessed, but it did not return a valid response: JSON containing user data was expected, but not received
                `)
            );
        }
    } catch (error: unknown) {
        logError(
            dedent(`
                Failed to establish communication with: ${url}

                ${errorMessage(error)}

                Make sure you have set up Jira correctly:
                - Base URL: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/jira/#url
                - Authentication: https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/authentication/#jira
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
