import type { CucumberJsonStatus } from "../../models/cucumber/status";

/**
 * Converts the given Cucumber status to an Xray status. Returns the original status if no matching
 * custom status is specified.
 *
 * @param state - the status text
 * @param options - optional custom statuses
 * @returns the Xray status
 */
export function getXrayStatus(
    status: string,
    statusOptions?: {
        failed?: string;
        passed?: string;
        pending?: string;
        skipped?: string;
    }
): string {
    // Cast for code completion purposes.
    switch (status as CucumberJsonStatus) {
        case "failed":
            return statusOptions?.failed ?? "failed";
        case "passed":
            return statusOptions?.passed ?? "passed";
        case "pending":
            return statusOptions?.pending ?? "pending";
        case "skipped":
            return statusOptions?.skipped ?? "skipped";
        case "undefined":
            return "undefined";
        case "unknown":
            return "unknown";
        default:
            throw new Error(`Unknown status: ${status}`);
    }
}
