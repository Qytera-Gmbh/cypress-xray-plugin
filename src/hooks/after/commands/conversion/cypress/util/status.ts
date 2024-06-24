import { XrayOptions } from "../../../../../../types/plugin";
import { Status } from "../../../../../../types/test-status";

/**
 * Converts the given status text string to a valid Cypress attempt status.
 *
 * @param statusText - the status text
 * @returns the Cypress attempt status
 * @throws if the status text cannot be mapped to a valid Cypress attempt status
 */
export function toCypressStatus(statusText: string): Status {
    switch (statusText) {
        case "passed":
            return Status.PASSED;
        case "failed":
            return Status.FAILED;
        case "pending":
            return Status.PENDING;
        case "skipped":
            return Status.SKIPPED;
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
    status: Status,
    useCloudStatus: boolean,
    statusOptions?: XrayOptions["status"]
): string {
    switch (status) {
        case Status.PASSED:
            return statusOptions?.passed ?? (useCloudStatus ? "PASSED" : "PASS");
        case Status.FAILED:
            return statusOptions?.failed ?? (useCloudStatus ? "FAILED" : "FAIL");
        case Status.PENDING:
            return statusOptions?.pending ?? (useCloudStatus ? "TO DO" : "TODO");
        case Status.SKIPPED:
            return statusOptions?.skipped ?? (useCloudStatus ? "FAILED" : "FAIL");
    }
}
