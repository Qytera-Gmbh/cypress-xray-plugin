/**
 * The general delay between intervals.
 */
const LOG_RESPONSE_INTERVAL_MS = 10000;

/**
 * Starts an informative timer which ticks in a predefined interval.
 *
 * @param onTick the function to call on each interval tick
 * @returns the timer's handler
 */
export function startInterval(onTick: (totalTime: number) => void): NodeJS.Timer {
    let sumTime = 0;
    const callback = () => {
        sumTime = sumTime + LOG_RESPONSE_INTERVAL_MS;
        onTick(sumTime);
    };
    return setInterval(callback, LOG_RESPONSE_INTERVAL_MS);
}
