import { AstBuilder, GherkinClassicTokenMatcher, Parser } from "@cucumber/gherkin";
import type { GherkinDocument } from "@cucumber/messages";
import { IdGenerator } from "@cucumber/messages";
import fs from "fs";

/**
 * Parses a Gherkin document (feature file) and returns the information contained within.
 *
 * @param file - the path to the feature file
 * @param encoding - the file's encoding
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
    return parser.parse(fs.readFileSync(file, { encoding: encoding }));
}
