import { StringMap } from "../types/util";

export function prettyPadObjects<T extends NonNullable<unknown>>(
    objects: T[]
): StringMap<string>[] {
    const maxPropertyLengths: { [key: string]: number } = {};
    for (let i = 0; i < objects.length; i++) {
        Object.entries(objects[i]).forEach((entry) => {
            const valueLength = JSON.stringify(entry[1]).length;
            if (!(entry[0] in maxPropertyLengths) || valueLength > maxPropertyLengths[entry[0]]) {
                maxPropertyLengths[entry[0]] = valueLength;
            }
        });
    }
    const paddedObjects: { [key: string]: string }[] = objects.map((element) => {
        const prettiedEntries = Object.entries(element).map((entry) => {
            return [entry[0], JSON.stringify(entry[1]).padEnd(maxPropertyLengths[entry[0]], " ")];
        });
        return Object.fromEntries(prettiedEntries);
    });
    return paddedObjects;
}

export function prettyPadValues<T extends StringMap<unknown>>(value: T): StringMap<string> {
    let maxPropertyLength: number = 0;
    Object.entries(value).forEach((entry) => {
        const valueLength = JSON.stringify(entry[1]).length;
        if (valueLength > maxPropertyLength) {
            maxPropertyLength = valueLength;
        }
    });
    const prettiedEntries = Object.entries(value).map((entry) => {
        return [entry[0], JSON.stringify(entry[1]).padEnd(maxPropertyLength, " ")];
    });
    return Object.fromEntries(prettiedEntries);
}
