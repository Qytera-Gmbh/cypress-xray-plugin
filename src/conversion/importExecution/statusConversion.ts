import { XrayOptions } from "../../types/plugin";
import { Status } from "../../types/testStatus";
import { getEnumKeyByEnumValue } from "../../types/util";

/**
 * Converts the given status text string to a valid Cypress attempt status.
 *
 * @param statusText the status text
 * @returns the Cypress attempt status
 * @throws if the status text cannot be mapped to a valid Cypress attempt status
 */
export function toCypressStatus(statusText: string): Status {
    const status: Status = Status[getEnumKeyByEnumValue(Status, statusText)];
    if (!status) {
        throw new Error(`Unknown Cypress attempt status: ${statusText}`);
    }
    return status;
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
 * @param state the status text
 * @param useCloudStatus whether to default to Xray cloud test statuses or Xray server ones
 * @param options optional custom statuses
 * @returns the Xray status
 */
export function getXrayStatus(
    status: Status,
    useCloudStatus: boolean,
    statusOptions?: XrayOptions["status"]
): string {
    switch (status) {
        case Status.PASSED:
            return statusOptions.passed ?? (useCloudStatus ? "PASSED" : "PASS");
        case Status.FAILED:
            return statusOptions.failed ?? (useCloudStatus ? "FAILED" : "FAIL");
        case Status.PENDING:
            return statusOptions.pending ?? "TODO";
        case Status.SKIPPED:
            return statusOptions.skipped ?? (useCloudStatus ? "FAILED" : "FAIL");
        default:
            throw new Error(`Unknown status: ${status}`);
    }
}
