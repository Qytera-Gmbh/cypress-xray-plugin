import { Background } from "@cucumber/messages";
import { expect } from "chai";
import path from "node:path";
import { parseFeatureFile } from "./gherkin";
import {
    getCucumberPreconditionIssueComments,
    getCucumberPreconditionIssueTags,
} from "./precondition";

describe(path.relative(process.cwd(), __filename), () => {
    describe(getCucumberPreconditionIssueComments.name, () => {
        it("extracts relevant comments without prefix", () => {
            const document = parseFeatureFile(
                "./test/resources/features/taggedNoPrefixMultipleBackground.feature"
            );
            // Cast because we know for certain it exists.
            const background = document.feature?.children[0].background as Background;
            const comments = getCucumberPreconditionIssueComments(background, document.comments);
            expect(comments).to.deep.eq(["#@CYP-244", "# a random comment", "#@CYP-262"]);
        });

        it("extracts relevant comments with prefix", () => {
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

        it("handles empty backgrounds", () => {
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

    describe(getCucumberPreconditionIssueTags.name, () => {
        it("extracts background tags without prefix", () => {
            const document = parseFeatureFile(
                "./test/resources/features/taggedNoPrefixMultipleBackground.feature"
            );
            // Cast because we know for certain it exists.
            const background = document.feature?.children[0].background as Background;
            const comments = getCucumberPreconditionIssueComments(background, document.comments);
            const tags = getCucumberPreconditionIssueTags(background, "CYP", comments);
            expect(tags).to.deep.eq(["CYP-244", "CYP-262"]);
        });

        it("extracts background tags with prefix", () => {
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

        it("handles empty backgrounds", () => {
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
