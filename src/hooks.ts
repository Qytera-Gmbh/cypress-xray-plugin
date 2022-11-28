export async function beforeRunHook(runDetails: Cypress.BeforeRunDetails) {
    console.log("after:run", runDetails);
}

export async function afterRunHook(
    results:
        | CypressCommandLine.CypressRunResult
        | CypressCommandLine.CypressFailedRunResult
) {
    console.log("after:run", results);
}

export async function afterScreenshotHook(details: Cypress.ScreenshotDetails) {}
