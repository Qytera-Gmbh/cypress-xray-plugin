import dedent from "dedent";

export function getTestIssueKey(title: string, projectKey: string): string | null {
    const regex = new RegExp(`(${projectKey}-\\d+)`, "g");
    const matches = title.match(regex);
    if (!matches) {
        throw new Error(
            dedent(`
                No test issue keys found in title of test: ${title}
                You can target existing test issues by adding a corresponding issue key:

                it("${projectKey}-123 ${title}", () => {
                    // ...
                });

                For more information, visit:
                - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
            `)
        );
    } else if (matches.length === 1) {
        return matches[0];
    } else {
        // Remove any circumflexes currently present in the title.
        let indicatorLine = title.replaceAll("^", " ");
        matches.forEach((match: string) => {
            indicatorLine = indicatorLine.replaceAll(match, "^".repeat(match.length));
        });
        // Replace everything but circumflexes with space.
        indicatorLine = indicatorLine.replaceAll(/[^^]/g, " ");
        throw new Error(
            dedent(`
                Multiple test keys found title of test: ${title}
                The plugin cannot decide for you which one to use:

                it("${title}", () => {
                    ${indicatorLine}
                    // ...
                });

                For more information, visit:
                - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
            `)
        );
    }
}
