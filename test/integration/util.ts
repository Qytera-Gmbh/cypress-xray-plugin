import { expectToExist } from "../util";

export function getCreatedTestExecutionIssueKey(
    projectKey: string,
    output: string[],
    uploadType: "both" | "cucumber" | "cypress"
): string {
    let regex: RegExp;
    switch (uploadType) {
        case "both":
            regex = new RegExp(`Uploaded test results to issue: (${projectKey}-\\d+)`);
            break;
        case "cucumber":
            regex = new RegExp(`Uploaded Cucumber test results to issue: (${projectKey}-\\d+)`);
            break;
        case "cypress":
            regex = new RegExp(`Uploaded Cypress test results to issue: (${projectKey}-\\d+)`);
            break;
    }
    const createdIssueLine = output.find((line) => regex.test(line))?.match(regex);
    expectToExist(createdIssueLine);
    const testExecutionIssueKey = createdIssueLine[1];
    expectToExist(testExecutionIssueKey);
    return testExecutionIssueKey;
}
