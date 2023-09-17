/**
 * Retrieve the overall earliest date of multiple dates.
 *
 * @param dates the dates
 * @returns the earliest date
 */
export function getEarliestDate(...dates: Date[]): Date | null {
    let start: Date = null;
    dates.forEach((date: Date) => {
        if (!start || date < start) {
            start = date;
        }
    });
    return start;
}

/**
 * Retrieve the overall latest date of multiple dates.
 *
 * @param dates the dates
 * @returns the latest date
 */
export function getLatestDate(...dates: Date[]): Date | null {
    let end: Date = null;
    dates.forEach((date: Date) => {
        if (!end || date > end) {
            end = date;
        }
    });
    return end;
}
