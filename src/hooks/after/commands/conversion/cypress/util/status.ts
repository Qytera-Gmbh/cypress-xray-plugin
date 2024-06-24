import { CypressStatus } from "../../../../../../types/cypress/status";
import { XrayOptions } from "../../../../../../types/plugin";

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
 * Converts the given status to an Xray status. If any of the following are `undefined`, their
 * respective Xray cloud or Xray server status values will be returned instead according to
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
    status: string,
    useCloudStatus: boolean,
    statusOptions?: XrayOptions["status"]
): string {
    switch (status) {
        case "passed":
            return statusOptions?.passed ?? (useCloudStatus ? "PASSED" : "PASS");
        case "failed":
            return statusOptions?.failed ?? (useCloudStatus ? "FAILED" : "FAIL");
        case "pending":
        case "undefined":
        case "unknown":
            return statusOptions?.pending ?? (useCloudStatus ? "TO DO" : "TODO");
        case "skipped":
            return statusOptions?.skipped ?? (useCloudStatus ? "FAILED" : "FAIL");
        default:
            throw new Error(`Unknown status: ${status}`);
    }
}
