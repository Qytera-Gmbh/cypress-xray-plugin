/**
 * Remove milliseconds from ISO time string.
 *
 * @param time - a date time string in ISO format
 * @returns the truncated date time string
 * @example
 *   const time = truncateISOTime("2022-12-01T02:30:44.744Z")
 *   console.log(time); // "2022-12-01T02:30:44Z"
 */
export function truncateIsoTime(time: string): string {
    return time.split(".")[0] + "Z";
}

/**
 * The general delay between intervals.
 */
const LOG_RESPONSE_INTERVAL_MS = 10000;

/**
 * Starts an informative timer which ticks in a predefined interval.
 *
 * @param onTick - the function to call on each interval tick
 * @returns the timer's handler
 */
export function startInterval(onTick: (totalTime: number) => void): ReturnType<typeof setInterval> {
    let sumTime = 0;
    const callback = () => {
        sumTime = sumTime + LOG_RESPONSE_INTERVAL_MS;
        onTick(sumTime);
    };
    return setInterval(callback, LOG_RESPONSE_INTERVAL_MS);
}

/**
 * Returns the earliest date of all specified dates.
 *
 * @param dates - the dates
 * @returns the earliest date
 */
export function earliestDate(...dates: Date[]): Date {
    return new Date(Math.min(...dates.map((date) => date.getTime())));
}

/**
 * Returns the latest date of all specified dates.
 *
 * @param dates - the dates
 * @returns the latest date
 */
export function latestDate(...dates: Date[]): Date {
    return new Date(Math.max(...dates.map((date) => date.getTime())));
}
