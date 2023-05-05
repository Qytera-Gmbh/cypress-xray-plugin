import {
    BasicAuthCredentials,
    PATCredentials,
} from "../../authentication/credentials";
import { Client } from "../client";

/**
 * A Jira client class for communicating with Jira instances.
 */
export abstract class JiraClient extends Client<
    BasicAuthCredentials | PATCredentials
> {
    /**
     * The Jira URL.
     */
    private readonly apiBaseURL: string;
    /**
     * Construct a new Jira client using the provided credentials.
     *
     * @param apiBaseURL the Jira base endpoint
     * @param credentials the credentials to use during authentication
     */
    constructor(
        apiBaseURL: string,
        credentials: BasicAuthCredentials | PATCredentials
    ) {
        super(credentials);
        this.apiBaseURL = apiBaseURL;
    }
}
