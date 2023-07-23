import { AstBuilder, GherkinClassicTokenMatcher, Parser } from "@cucumber/gherkin";
import { Background, Comment, GherkinDocument, IdGenerator, Scenario } from "@cucumber/messages";
import fs from "fs";
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
    return parser.parse(fs.readFileSync(file, { encoding: encoding }));
}

function scenarioRegex(projectKey: string) {
    // Xray cloud: @TestName:CYP-123
    // Xray server: @CYP-123
    return new RegExp(`@(?:TestName:)?(${projectKey}-\\d+)`);
}

export function getTestIssueTags(scenario: Scenario, projectKey: string): string[] {
    const issueKeys: string[] = [];
    for (const tag of scenario.tags) {
        const matches = tag.name.match(scenarioRegex(projectKey));
        if (!matches) {
            continue;
        } else if (matches.length === 2) {
            issueKeys.push(matches[1]);
        }
    }
    return issueKeys;
}

function backgroundRegex(projectKey: string) {
    // @Precondition:CYP-111
    return new RegExp(`@Precondition:(${projectKey}-\\d+)`);
}

export function getPreconditionIssueTags(
    background: Background,
    projectKey: string,
    comments: readonly Comment[]
): string[] {
    const preconditionKeys: string[] = [];
    if (background.steps.length > 0) {
        const backgroundLine = background.location.line;
        const firstStepLine = background.steps[0].location.line;
        for (const comment of comments) {
            if (comment.location.line > backgroundLine && comment.location.line < firstStepLine) {
                const matches = comment.text.match(backgroundRegex(projectKey));
                if (!matches) {
                    continue;
                } else if (matches.length === 2) {
                    preconditionKeys.push(matches[1]);
                }
            }
        }
    }
    return preconditionKeys;
}
