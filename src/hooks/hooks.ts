import { LOG, Level } from "../logging/logging";
import { IssueTypeDetails } from "../types/jira/responses/issueTypeDetails";
import { ClientCombination, InternalCypressXrayPluginOptions } from "../types/plugin";
import { dedent } from "../util/dedent";
import { HELP } from "../util/help";

export async function beforeRunHook(
    specs: Cypress.Spec[],
    options: InternalCypressXrayPluginOptions,
    clients: ClientCombination
) {
    // Cucumber upload requires additional test execution issue information.
    if (
        specs.some(
            (spec: Cypress.Spec) =>
                options.cucumber &&
                options.xray.uploadResults &&
                spec.absolute.endsWith(options.cucumber.featureFileExtension)
        )
    ) {
        LOG.message(
            Level.INFO,
            "Fetching necessary Jira issue type information in preparation for Cucumber result uploads..."
        );
        const issueDetails = await clients.jiraClient.getIssueTypes();
        options.jira.testExecutionIssueDetails = retrieveIssueTypeInformation(
            options.jira.testExecutionIssueType,
            issueDetails,
            options.jira.projectKey
        );
    }
}

function retrieveIssueTypeInformation(
    type: string,
    issueDetails: IssueTypeDetails[],
    projectKey: string
): IssueTypeDetails {
    const details = issueDetails.filter((issueDetail) => issueDetail.name === type);
    if (details.length === 0) {
        throw new Error(
            dedent(`
                Failed to retrieve issue type information for issue type: ${type}

                Make sure you have Xray installed.

                For more information, visit:
                - ${HELP.plugin.configuration.jira.testExecutionIssueType}
                - ${HELP.plugin.configuration.jira.testPlanIssueType}
            `)
        );
    } else if (details.length > 1) {
        throw new Error(
            dedent(`
                Found multiple issue types named: ${type}

                Make sure to only make a single one available in project ${projectKey}.

                For more information, visit:
                - ${HELP.plugin.configuration.jira.testExecutionIssueType}
                - ${HELP.plugin.configuration.jira.testPlanIssueType}
            `)
        );
    }
    return details[0];
}
