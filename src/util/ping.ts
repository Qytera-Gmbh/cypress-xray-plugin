import { AxiosResponse } from "axios";
import { BasicAuthCredentials, PatCredentials } from "../client/authentication/credentials";
import { AxiosRestClient } from "../client/https/requests";
import { User } from "../types/jira/responses/user";
import { dedent } from "./dedent";
import { errorMessage } from "./errors";
import { HELP } from "./help";
import { LOG, Level } from "./logging";
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
