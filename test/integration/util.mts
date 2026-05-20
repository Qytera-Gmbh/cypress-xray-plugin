// eslint-disable-next-line @typescript-eslint/naming-convention
const { dedent } = await import("../../src/util/dedent.js");

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
    if (!createdIssueLine || createdIssueLine.length === 0) {
        throw new Error(
            dedent(`
                Failed to find test execution issue key in output using pattern: ${regex.toString()}

                    output:

                        ${output.join("\n")}
            `)
        );
    }
    return createdIssueLine[1];
}

export function shouldRunIntegrationTests(environment: "cloud" | "server"): boolean {
    if (process.env.INTEGRATION_TESTS_ENVIRONMENT) {
        return process.env.INTEGRATION_TESTS_ENVIRONMENT === environment;
    }
    return true;
}
