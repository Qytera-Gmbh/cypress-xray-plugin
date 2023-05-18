import { AstBuilder, GherkinClassicTokenMatcher, Parser } from "@cucumber/gherkin";
import { GherkinDocument, IdGenerator } from "@cucumber/messages";
import { readFileSync } from "fs";

/**
 * Parses and returns a boolean value from a string.
 *
 * @param value a string that can be interpreted as a boolean value
 * @returns the corresponding boolean value
 * @see https://www.npmjs.com/package/yn
 */
export function parseBoolean(value: string): boolean {
    value = String(value).trim();

    if (/^(?:y|yes|true|1|on)$/i.test(value)) {
        return true;
    }

    if (/^(?:n|no|false|0|off)$/i.test(value)) {
        return false;
    }

    throw new Error(`Failed to parse boolean value from string: ${value}`);
}

/**
 * Parses a Gherkin document (feature file) and returns the information contained within.
 *
 * @param file the path to the feature file
 * @param encoding the file's encoding
 * @returns an object containing the data of the feature file
 * @example
 *   const data = parseFeatureFile("myTetest.feature")
 *   console.log(data.feature.children[0].scenario); // steps, name, ...
 * @see https://github.com/cucumber/messages/blob/main/javascript/src/messages.ts
 */
export function parseFeatureFile(
    file: string,
    encoding: BufferEncoding = "utf-8"
): GherkinDocument {
    const uuidFn = IdGenerator.uuid();
    const builder = new AstBuilder(uuidFn);
    const matcher = new GherkinClassicTokenMatcher();
    const parser = new Parser(builder, matcher);
    return parser.parse(readFileSync(file, { encoding: encoding }));
}
