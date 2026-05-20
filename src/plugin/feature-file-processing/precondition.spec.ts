import type { Background } from "@cucumber/messages";
import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { parseFeatureFile } from "./gherkin";
import {
    getCucumberPreconditionIssueComments,
    getCucumberPreconditionIssueTags,
} from "./precondition";

void describe(relative(cwd(), __filename), () => {
    void describe(getCucumberPreconditionIssueComments.name, () => {
        void it("extracts relevant comments without prefix", () => {
            const document = parseFeatureFile(
                "./test/resources/features/taggedNoPrefixMultipleBackground.feature"
            );
            // Cast because we know for certain it exists.
            const background = document.feature?.children[0].background as Background;
            const comments = getCucumberPreconditionIssueComments(background, document.comments);
            assert.deepStrictEqual(comments, [
                { location: { column: 1, line: 4 }, text: "    #@CYP-244" },
                { location: { column: 1, line: 5 }, text: "    # a random comment" },
                { location: { column: 1, line: 6 }, text: "    #@CYP-262" },
            ]);
        });

        void it("extracts relevant comments with prefix", () => {
            const document = parseFeatureFile(
                "./test/resources/features/taggedPrefixMultipleBackground.feature"
            );
            // Cast because we know for certain it exists.
            const background: Background = document.feature?.children[0].background as Background;
            const comments = getCucumberPreconditionIssueComments(background, document.comments);
            assert.deepStrictEqual(comments, [
                { location: { column: 1, line: 4 }, text: "    #@Precondition:CYP-244" },
                { location: { column: 1, line: 5 }, text: "    # a random comment" },
                { location: { column: 1, line: 6 }, text: "    #@Precondition:CYP-262" },
            ]);
        });

        void it("handles empty backgrounds", () => {
            const document = parseFeatureFile(
                "./test/resources/features/taggedNoPrefixMultipleBackground.feature"
            );
            // Cast because we know for certain it exists.
            const background = document.feature?.children[0].background as Background;
            background.steps = [];
            const comments = getCucumberPreconditionIssueComments(background, document.comments);
            assert.deepStrictEqual(comments, []);
        });
    });

    void describe(getCucumberPreconditionIssueTags.name, () => {
        void it("extracts background tags without prefix", () => {
            const document = parseFeatureFile(
                "./test/resources/features/taggedNoPrefixMultipleBackground.feature"
            );
            // Cast because we know for certain it exists.
            const background = document.feature?.children[0].background as Background;
            const comments = getCucumberPreconditionIssueComments(background, document.comments);
            const tags = getCucumberPreconditionIssueTags(background, "CYP", comments);
            assert.deepStrictEqual(tags, ["CYP-244", "CYP-262"]);
        });

        void it("extracts background tags with prefix", () => {
            const document = parseFeatureFile(
                "./test/resources/features/taggedPrefixMultipleBackground.feature"
            );
            // Cast because we know for certain it exists.
            const background: Background = document.feature?.children[0].background as Background;
            const comments = getCucumberPreconditionIssueComments(background, document.comments);
            const tags = getCucumberPreconditionIssueTags(
                background,
                "CYP",
                comments,
                "Precondition:"
            );
            assert.deepStrictEqual(tags, ["CYP-244", "CYP-262"]);
        });

        void it("handles empty backgrounds", () => {
            const document = parseFeatureFile(
                "./test/resources/features/taggedPrefixMultipleBackground.feature"
            );
            // Cast because we know for certain it exists.
            const background: Background = document.feature?.children[0].background as Background;
            background.steps = [];
            const tags = getCucumberPreconditionIssueTags(background, "CYP", [], "Precondition:");
            assert.deepStrictEqual(tags, []);
        });
    });
});
