import type { HasGetFieldsEndpoint } from "../../client/jira/jira-client";
import type { FieldDetail } from "../../models/jira/responses/field-detail";
import type { JiraFieldIds, PluginIssueUpdate } from "../../models/plugin";
import { dedent } from "../../util/dedent";
import { errorMessage } from "../../util/errors";
import { prettyPadObjects, prettyPadValues } from "../../util/pretty";
import type { TestExecutionIssueData, TestExecutionIssueDataServer } from "./multipart-info";
import { buildMultipartInfoCloud, buildMultipartInfoServer } from "./multipart-info";

function convertMultipartInfoCloud(parameters: {
    cypress: {
        config: {
            browserName: string;
            browserVersion: string;
            cypressVersion: string;
        };
    };
    options: {
        jira: {
            projectKey: string;
            testExecutionIssue?: PluginIssueUpdate & {
                testEnvironments?: readonly [string, ...string[]];
                testPlan?: string;
            };
        };
    };
}) {
    const errorMessages: string[] = [];
    const testExecutionIssueData: TestExecutionIssueData = {
        projectKey: parameters.options.jira.projectKey,
        testExecutionIssue: {
            fields: {
                ...parameters.options.jira.testExecutionIssue?.fields,
                issuetype: parameters.options.jira.testExecutionIssue?.fields?.issuetype,
                summary: parameters.options.jira.testExecutionIssue?.fields?.summary,
            },
            historyMetadata: parameters.options.jira.testExecutionIssue?.historyMetadata,
            properties: parameters.options.jira.testExecutionIssue?.properties,
            transition: parameters.options.jira.testExecutionIssue?.transition,
            update: parameters.options.jira.testExecutionIssue?.update,
        },
    };
    if (parameters.options.jira.testExecutionIssue?.testPlan) {
        testExecutionIssueData.testPlan = {
            value: parameters.options.jira.testExecutionIssue.testPlan,
        };
    }
    if (parameters.options.jira.testExecutionIssue?.testEnvironments) {
        testExecutionIssueData.testEnvironments = {
            value: parameters.options.jira.testExecutionIssue.testEnvironments,
        };
    }
    return {
        errorMessages: errorMessages,
        multipartInfo: buildMultipartInfoCloud({
            browserName: parameters.cypress.config.browserName,
            browserVersion: parameters.cypress.config.browserVersion,
            cypressVersion: parameters.cypress.config.cypressVersion,
            testExecutionIssueData: testExecutionIssueData,
        }),
    };
}

async function convertMultipartInfoServer(parameters: {
    client: HasGetFieldsEndpoint;
    cypress: {
        config: {
            browserName: string;
            browserVersion: string;
            cypressVersion: string;
        };
    };
    options: {
        jira: {
            fields: {
                testEnvironments?: string;
                testPlan?: string;
            };
            projectKey: string;
            testExecutionIssue?: PluginIssueUpdate & {
                testEnvironments?: readonly [string, ...string[]];
                testPlan?: string;
            };
        };
    };
}) {
    const errorMessages: string[] = [];
    const testExecutionIssueData: TestExecutionIssueDataServer = {
        projectKey: parameters.options.jira.projectKey,
        testExecutionIssue: {
            fields: {
                ...parameters.options.jira.testExecutionIssue?.fields,
                issuetype: parameters.options.jira.testExecutionIssue?.fields?.issuetype,
                summary: parameters.options.jira.testExecutionIssue?.fields?.summary,
            },
            historyMetadata: parameters.options.jira.testExecutionIssue?.historyMetadata,
            properties: parameters.options.jira.testExecutionIssue?.properties,
            transition: parameters.options.jira.testExecutionIssue?.transition,
            update: parameters.options.jira.testExecutionIssue?.update,
        },
    };
    // Neither test plans, nor test environments are required.
    if (
        !parameters.options.jira.testExecutionIssue?.testPlan &&
        !parameters.options.jira.testExecutionIssue?.testEnvironments
    ) {
        return {
            errorMessages: errorMessages,
            multipartInfo: buildMultipartInfoServer({
                browserName: parameters.cypress.config.browserName,
                browserVersion: parameters.cypress.config.browserVersion,
                cypressVersion: parameters.cypress.config.cypressVersion,
                testExecutionIssueData: testExecutionIssueData,
            }),
        };
    }
    // At least one of test plans or test environments is required.
    let testPlanFieldId = parameters.options.jira.fields.testPlan;
    let testEnvironmentsFieldId = parameters.options.jira.fields.testEnvironments;
    if (
        (!testPlanFieldId && parameters.options.jira.testExecutionIssue.testPlan) ||
        (!testEnvironmentsFieldId && parameters.options.jira.testExecutionIssue.testEnvironments)
    ) {
        const [allFields] = await Promise.allSettled([parameters.client.getFields()]);
        if (!testPlanFieldId && parameters.options.jira.testExecutionIssue.testPlan) {
            if (allFields.status === "rejected") {
                errorMessages.push(
                    dedent(`
                        Failed to fetch all Jira fields for test plan field ID extraction, the test execution issue may not be assigned to the desired test plan

                          ${errorMessage(allFields.reason)}
                    `)
                );
            } else {
                try {
                    testPlanFieldId = getFieldId("test plan", allFields.value);
                } catch (error: unknown) {
                    errorMessages.push(errorMessage(error));
                }
            }
        }
        if (
            !testEnvironmentsFieldId &&
            parameters.options.jira.testExecutionIssue.testEnvironments
        ) {
            if (allFields.status === "rejected") {
                errorMessages.push(
                    dedent(`
                        Failed to fetch all Jira fields for test environment field ID extraction, the test execution issue may not be assigned the desired test environments

                          ${errorMessage(allFields.reason)}
                    `)
                );
            } else {
                try {
                    testEnvironmentsFieldId = getFieldId("test environments", allFields.value);
                } catch (error: unknown) {
                    errorMessages.push(errorMessage(error));
                }
            }
        }
    }
    if (testPlanFieldId && parameters.options.jira.testExecutionIssue.testPlan) {
        testExecutionIssueData.testPlan = {
            fieldId: testPlanFieldId,
            value: parameters.options.jira.testExecutionIssue.testPlan,
        };
    }
    if (testEnvironmentsFieldId && parameters.options.jira.testExecutionIssue.testEnvironments) {
        testExecutionIssueData.testEnvironments = {
            fieldId: testEnvironmentsFieldId,
            value: parameters.options.jira.testExecutionIssue.testEnvironments,
        };
    }
    return {
        errorMessages: errorMessages,
        multipartInfo: buildMultipartInfoServer({
            browserName: parameters.cypress.config.browserName,
            browserVersion: parameters.cypress.config.browserVersion,
            cypressVersion: parameters.cypress.config.cypressVersion,
            testExecutionIssueData: testExecutionIssueData,
        }),
    };
}

function getFieldId(fieldName: "test environments" | "test plan", allFields: FieldDetail[]) {
    // Lowercase everything to work around case sensitivities.
    // Jira sometimes returns field names capitalized, sometimes it doesn't (?).
    const lowerCasedName = fieldName.toLowerCase();
    const matches = allFields.filter((field: FieldDetail) => {
        return field.name.toLowerCase() === lowerCasedName;
    });
    if (matches.length > 1) {
        const nameDuplicates = prettyPadObjects(matches)
            .map((duplicate) =>
                Object.entries(duplicate)
                    .map((entry) => `${entry[0]}: ${entry[1]}`)
                    .join(", ")
            )
            .sort()
            .join("\n");
        const idSuggestions = matches.map((field: FieldDetail) => `"${field.id}"`).join(" or ");
        throw new Error(
            dedent(`
                Failed to fetch Jira field ID for field with name: ${fieldName}
                There are multiple fields with this name

                Duplicates:
                  ${nameDuplicates}

                You can provide field IDs in the options:

                  jira: {
                    fields: {
                      ${getOptionName(fieldName)}: // ${idSuggestions}
                    }
                  }
            `)
        );
    }
    if (matches.length === 0) {
        const fieldNames: Record<string, string> = {};
        allFields.forEach((field: FieldDetail) => {
            fieldNames[field.id] = field.name;
        });
        if (Object.keys(fieldNames).length === 0) {
            throw new Error(
                dedent(`
                    Failed to fetch Jira field ID for field with name: ${fieldName}
                    Make sure the field actually exists and that your Jira language settings did not modify the field's name

                    You can provide field IDs directly without relying on language settings:

                      jira: {
                        fields: {
                          ${getOptionName(fieldName)}: // corresponding field ID
                        }
                      }
                `)
            );
        } else {
            const availableFields = Object.entries(prettyPadValues(fieldNames))
                .map((entry) => `name: ${entry[1]} id: ${JSON.stringify(entry[0])}`)
                .sort();
            throw new Error(
                dedent(`
                    Failed to fetch Jira field ID for field with name: ${fieldName}
                    Make sure the field actually exists and that your Jira language settings did not modify the field's name

                    Available fields:
                      ${availableFields.join("\n")}

                    You can provide field IDs directly without relying on language settings:

                      jira: {
                        fields: {
                          ${getOptionName(fieldName)}: // corresponding field ID
                        }
                      }
                `)
            );
        }
    }
    return matches[0].id;
}

function getOptionName(fieldName: "test environments" | "test plan"): keyof JiraFieldIds {
    switch (fieldName) {
        case "test environments":
            return "testEnvironments";
        case "test plan":
            return "testPlan";
    }
}

/**
 * Workaround until module mocking becomes a stable feature. The current approach allows replacing
 * the functions with a mocked one.
 *
 * @see https://nodejs.org/docs/latest-v23.x/api/test.html#mockmodulespecifier-options
 */
export default { convertMultipartInfoCloud, convertMultipartInfoServer };
