import { FieldReturnType } from "../../../repository/jira/jiraIssueStoreAsync";
import { Remap } from "../../../types/util";
import { Test } from "../../../types/xray/responses/graphql/xray";
import { dedent } from "../../../util/dedent";

export type GetTestsJiraData = FieldReturnType & {
    key: string;
};

export function buildGetTests(testResultsData: Remap<Test<GetTestsJiraData>, boolean>): string {
    const query = dedent(`
        query($jql: String, $start: Int!, $limit: Int!) {
            getTests(jql: $jql, start: $start, limit: $limit) {
                total
                start

                results {
                    testType {
                        name
                        kind
                    }
                    jira(fields: ["key"])
                }
            }
        }
    `);
    return query;
}

function buildResults(testResultsData: Remap<Test<GetTestsJiraData>, boolean>): string | null {
    let queryMembers: (string | null)[] = [];
    queryMembers.push(buildQueryMember("issueId", testResultsData.issueId));
    queryMembers.push(buildQueryMember("projectId", testResultsData.projectId));
    queryMembers.push(buildQueryMember("testType", testResultsData.testType));
    queryMembers.push(buildQueryMember("steps", testResultsData.steps));
    queryMembers.push(buildQueryMember("unstructured", testResultsData.unstructured));
    queryMembers.push(buildQueryMember("gherkin", testResultsData.gherkin));
    queryMembers.push(buildQueryMember("folder", testResultsData.folder));
    queryMembers.push(buildQueryMember("scenarioType", testResultsData.scenarioType));
    queryMembers = queryMembers.filter((member) => member !== null);
    if (queryMembers.length > 0) {
        return dedent(`
            results {
                ${queryMembers.join("\n")}
            }
        `);
    }
    return null;
}

function buildTestType(testResultsData: Remap<Test<GetTestsJiraData>, boolean>): string | null {
    const queryMembers: string[] = [];
    if (testResultsData.testType?.id) {
        queryMembers.push("id");
    }
    if (testResultsData.testType?.kind) {
        queryMembers.push("kind");
    }
    if (testResultsData.testType?.name) {
        queryMembers.push("name");
    }
    if (queryMembers.length > 0) {
        return dedent(`
            testType {
                ${queryMembers.join("\n")}
            }
        `);
    }
    return null;
}

function buildQueryMember<T>(name: string, object?: NonNullable<T>): string | null {
    if (!object) {
        return null;
    }
    if (typeof object === "boolean" && object) {
        return name;
    }
    if (typeof object === "object") {
        let queryMembers: (string | null)[] = [];
        Object.entries(object).forEach(([key, value]) => {
            queryMembers.push(buildQueryMember(value, key));
        });
        queryMembers = queryMembers.filter((member) => member !== null);
        if (queryMembers.length > 0) {
            return dedent(`
                ${name} {
                    ${queryMembers.join("\n")}
                }
            `);
        }
    }
    return null;
}
