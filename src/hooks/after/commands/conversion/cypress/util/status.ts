import { CypressStatus } from "../../../../../../types/cypress/status";

/**
 * Converts the given status text string to a valid Cypress attempt status.
 *
 * @param statusText - the status text
 * @returns the Cypress attempt status
 * @throws if the status text cannot be mapped to a valid Cypress attempt status
 */
export function toCypressStatus(statusText: string): CypressStatus {
    switch (statusText) {
        case "passed":
            return CypressStatus.PASSED;
        case "failed":
            return CypressStatus.FAILED;
        case "pending":
            return CypressStatus.PENDING;
        case "skipped":
            return CypressStatus.SKIPPED;
        default:
            throw new Error(`Unknown Cypress test status: ${statusText}`);
    }
}

/**
 * Converts the given Cypress status to an Xray status. If any of the following are `undefined`,
 * their respective Xray cloud or Xray server status values will be returned instead according to
 * `useCloudStatus`:
 *
 * - `statusOptions.passed`
 * - `statusOptions.failed`
 * - `statusOptions.pending`
 * - `statusOptions.skipped`
 *
 * @param state - the status text
 * @param useCloudStatus - whether to default to Xray cloud test statuses or Xray server ones
 * @param options - optional custom statuses
 * @returns the Xray status
 */
export function getXrayStatus(
    status: CypressStatus | CypressStatus[],
    useCloudStatus: boolean,
    statusOptions?: {
        failed?: string;
        passed?: string;
        pending?: string;
        skipped?: string;
    }
): string {
    const lookupStatus = (cypressStatus: CypressStatus) => {
        switch (cypressStatus) {
            case CypressStatus.PASSED:
                return statusOptions?.passed ?? (useCloudStatus ? "PASSED" : "PASS");
            case CypressStatus.FAILED:
                return statusOptions?.failed ?? (useCloudStatus ? "FAILED" : "FAIL");
            case CypressStatus.PENDING:
                return statusOptions?.pending ?? (useCloudStatus ? "TO DO" : "TODO");
            case CypressStatus.SKIPPED:
                return statusOptions?.skipped ?? (useCloudStatus ? "FAILED" : "FAIL");
        }
    };
    if (typeof status === "string") {
        return lookupStatus(status);
    }
    const passed = status.filter((s) => s === CypressStatus.PASSED).length;
    const failed = status.filter((s) => s === CypressStatus.FAILED).length;
    const pending = status.filter((s) => s === CypressStatus.PENDING).length;
    const skipped = status.filter((s) => s === CypressStatus.SKIPPED).length;
    if (passed > 0 && failed === 0 && skipped === 0) {
        return lookupStatus(CypressStatus.PASSED);
    }
    if (passed === 0 && failed === 0 && skipped === 0 && pending > 0) {
        return lookupStatus(CypressStatus.PENDING);
    }
    if (skipped > 0) {
        return lookupStatus(CypressStatus.SKIPPED);
    }
    return lookupStatus(CypressStatus.FAILED);
}
