import { dedent } from "./dedent";
import { HELP } from "./help";
import { unknownToString } from "./string";

/**
 * Extracts Jira issue keys from a Cypress test title, based on the provided project key.
 *
 * @param title - the test title
 * @param projectKey - the Jira projectk key
 * @returns the Jira issue keys
 * @throws if the title contains zero issue keys
 */
export function extractIssueKeys(title: string, projectKey: string): [string, ...string[]] {
    const regex = new RegExp(`(${projectKey}-\\d+)`, "g");
    const matches = title.match(regex);
    if (!matches) {
        throw new Error(
            dedent(`
                Test: ${title}

                  No test issue keys found in title.

                  You can target existing test issues by adding a corresponding issue key:

                    it("${projectKey}-123 ${title}", () => {
                      // ...
                    });

                  For more information, visit:
                  - ${HELP.plugin.guides.targetingExistingIssues}
            `)
        );
    }
    const [key, ...keys] = matches;
    return [key, ...keys];
}

/**
 * Extracts a string property from an object.
 *
 * @param data - the object
 * @param propertyName - the property to access
 * @returns the property's string value
 * @throws if `data` is not an object or does not contain a string property `propertyName`
 */
export function extractString(data: unknown, propertyName: string): string {
    verifyIsObjectWithProperty(data, propertyName);
    const value = data[propertyName];
    if (typeof value !== "string") {
        throw new Error(`Value is not of type string: ${unknownToString(value)}`);
    }
    return value;
}

/**
 * Extracts a string array property from an object.
 *
 * @param data - the object
 * @param propertyName - the property to access
 * @returns the property's string array value
 * @throws if `data` is not an object or does not contain a string array property `propertyName`
 */
export function extractArrayOfStrings(data: unknown, propertyName: string): string[] {
    verifyIsObjectWithProperty(data, propertyName);
    const value = data[propertyName];
    if (!Array.isArray(value) || value.some((element) => typeof element !== "string")) {
        throw new Error(`Value is not an array of type string: ${JSON.stringify(value)}`);
    }
    return value as string[];
}

function verifyIsObjectWithProperty(
    data: unknown,
    propertyName: string
): asserts data is Record<string, unknown> {
    if (typeof data !== "object" || data === null || !(propertyName in data)) {
        throw new Error(
            `Expected an object containing property '${propertyName}', but got: ${JSON.stringify(
                data
            )}`
        );
    }
}
