export function equalsIgnoreOrder<T>(a: T[], b: T[]): boolean {
    if (a.length !== b.length) {
        return false;
    }
    return a.every((element: T) => b.includes(element));
}
