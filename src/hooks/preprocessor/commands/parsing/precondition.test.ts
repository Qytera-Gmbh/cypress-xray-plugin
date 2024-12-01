import type { Background } from "@cucumber/messages";
import { expect } from "chai";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { parseFeatureFile } from "./gherkin.js";
import {
    getCucumberPreconditionIssueComments,
    getCucumberPreconditionIssueTags,
} from "./precondition.js";

await describe(relative(cwd(), import.meta.filename), async () => {
    await describe(getCucumberPreconditionIssueComments.name, async () => {
        await it("extracts relevant comments without prefix", () => {
            const document = parseFeatureFile(
                "./test/resources/features/taggedNoPrefixMultipleBackground.feature"
            );
            // Cast because we know for certain it exists.
            const background = document.feature?.children[0].background as Background;
            const comments = getCucumberPreconditionIssueComments(background, document.comments);
            expect(comments).to.deep.eq(["#@CYP-244", "# a random comment", "#@CYP-262"]);
        });

        await it("extracts relevant comments with prefix", () => {
            const document = parseFeatureFile(
                "./test/resources/features/taggedPrefixMultipleBackground.feature"
            );
            // Cast because we know for certain it exists.
            const background: Background = document.feature?.children[0].background as Background;
            const comments = getCucumberPreconditionIssueComments(background, document.comments);
            expect(comments).to.deep.eq([
                "#@Precondition:CYP-244",
                "# a random comment",
                "#@Precondition:CYP-262",
            ]);
        });

        await it("handles empty backgrounds", () => {
            const document = parseFeatureFile(
                "./test/resources/features/taggedNoPrefixMultipleBackground.feature"
            );
            // Cast because we know for certain it exists.
            const background = document.feature?.children[0].background as Background;
            background.steps = [];
            const comments = getCucumberPreconditionIssueComments(background, document.comments);
            expect(comments).to.deep.eq([]);
        });
    });

    await describe(getCucumberPreconditionIssueTags.name, async () => {
        await it("extracts background tags without prefix", () => {
            const document = parseFeatureFile(
                "./test/resources/features/taggedNoPrefixMultipleBackground.feature"
            );
            // Cast because we know for certain it exists.
            const background = document.feature?.children[0].background as Background;
            const comments = getCucumberPreconditionIssueComments(background, document.comments);
            const tags = getCucumberPreconditionIssueTags(background, "CYP", comments);
            expect(tags).to.deep.eq(["CYP-244", "CYP-262"]);
        });

        await it("extracts background tags with prefix", () => {
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
            expect(tags).to.deep.eq(["CYP-244", "CYP-262"]);
        });

        await it("handles empty backgrounds", () => {
            const document = parseFeatureFile(
                "./test/resources/features/taggedPrefixMultipleBackground.feature"
            );
            // Cast because we know for certain it exists.
            const background: Background = document.feature?.children[0].background as Background;
            background.steps = [];
            const tags = getCucumberPreconditionIssueTags(background, "CYP", [], "Precondition:");
            expect(tags).to.deep.eq([]);
        });
    });
});