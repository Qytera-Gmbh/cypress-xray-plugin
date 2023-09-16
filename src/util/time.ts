/**
 * Remove milliseconds from ISO time string.
 *
 * @param time a date time string in ISO format
 * @returns the truncated date time string
 * @example
 *   const time = truncateISOTime("2022-12-01T02:30:44.744Z")
 *   console.log(time); // "2022-12-01T02:30:44Z"
 */
export function truncateISOTime(time: string): string {
    return time.split(".")[0] + "Z";
}
