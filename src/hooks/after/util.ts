export function containsCucumberTest(
    runResult: CypressCommandLine.CypressRunResult,
    featureFileExtension?: string
): boolean {
    return runResult.runs.some((run: CypressCommandLine.RunResult) => {
        if (featureFileExtension && run.spec.absolute.endsWith(featureFileExtension)) {
            return true;
        }
        return false;
    });
}
