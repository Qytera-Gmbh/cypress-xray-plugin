import { expect } from "chai";
import path from "path";
import { getMockedLogger, getMockedXrayClient } from "../../../test/mocks";
import { Level } from "../../logging/logging";
import { FeatureFileIssueData } from "../../preprocessing/preprocessing";
import { StringMap } from "../../types/util";
import { ImportFeatureResponse } from "../../types/xray/responses/importFeature";
import { dedent } from "../../util/dedent";
import {
    gatherAllIssueKeys,
    getActualAffectedIssueKeys,
    getLabelsToReset,
    getSummariesToReset,
} from "./commands";

describe(path.relative(process.cwd(), __filename), () => {
    describe(gatherAllIssueKeys.name, () => {
        it("merges all issue keys into one array", () => {
            const data: FeatureFileIssueData = {
                tests: [
                    { key: "CYP-123", summary: "Hello", tags: [] },
                    { key: "CYP-456", summary: "There", tags: ["some tag"] },
                    { key: "CYP-789", summary: "Guys", tags: ["another tag", "and another one"] },
                ],
                preconditions: [{ key: "CYP-001", summary: "Background" }],
            };
            expect(gatherAllIssueKeys(data)).to.deep.eq([
                "CYP-123",
                "CYP-456",
                "CYP-789",
                "CYP-001",
            ]);
        });
    });

    describe(getActualAffectedIssueKeys.name, () => {
        it("returns all affected issues", () => {
            const data: ImportFeatureResponse = {
                errors: [],
                updatedOrCreatedIssues: ["CYP-123", "CYP-456", "CYP-789", "CYP-001"],
            };
            expect(
                getActualAffectedIssueKeys([["CYP-123", "CYP-456", "CYP-789", "CYP-001"], data])
            ).to.deep.eq(["CYP-123", "CYP-456", "CYP-789", "CYP-001"]);
        });

        it("warns about unknown updated issues", () => {
            const logger = getMockedLogger();
            const xrayClient = getMockedXrayClient();
            xrayClient.importFeature.onFirstCall().resolves({
                errors: [],
                updatedOrCreatedIssues: ["CYP-536", "CYP-552"],
            });
            expect(
                getActualAffectedIssueKeys([
                    [],
                    {
                        errors: [],
                        updatedOrCreatedIssues: ["CYP-536", "CYP-552"],
                    },
                ])
            ).to.deep.eq([]);
            expect(logger.message).to.have.been.calledWithExactly(
                Level.WARNING,
                dedent(`
                    Mismatch between feature file issue tags and updated Jira issues detected

                    Issues updated by Jira which are not present in feature file tags and might have been created:
                      CYP-536
                      CYP-552

                    Make sure that:
                    - All issues present in feature file tags belong to existing issues
                    - Your plugin tag prefix settings are consistent with the ones defined in Xray

                    More information:
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/cucumber/#prefixes
                `)
            );
        });

        it("warns about issues not updated by Jira", () => {
            const logger = getMockedLogger();
            const xrayClient = getMockedXrayClient();
            xrayClient.importFeature.onFirstCall().resolves({
                errors: [],
                updatedOrCreatedIssues: [],
            });
            expect(
                getActualAffectedIssueKeys([
                    ["CYP-123", "CYP-756"],
                    {
                        errors: [],
                        updatedOrCreatedIssues: [],
                    },
                ])
            ).to.deep.eq([]);
            expect(logger.message).to.have.been.calledWithExactly(
                Level.WARNING,
                dedent(`
                    Mismatch between feature file issue tags and updated Jira issues detected

                    Issues contained in feature file tags which were not updated by Jira and might not exist:
                      CYP-123
                      CYP-756

                    Make sure that:
                    - All issues present in feature file tags belong to existing issues
                    - Your plugin tag prefix settings are consistent with the ones defined in Xray

                    More information:
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/cucumber/#prefixes
                `)
            );
        });

        it("warns about issue key mismatches", () => {
            const logger = getMockedLogger();
            const xrayClient = getMockedXrayClient();
            xrayClient.importFeature.onFirstCall().resolves({
                errors: [],
                updatedOrCreatedIssues: ["CYP-536", "CYP-552", "CYP-756"],
            });
            expect(
                getActualAffectedIssueKeys([
                    ["CYP-123", "CYP-756", "CYP-42"],
                    {
                        errors: [],
                        updatedOrCreatedIssues: ["CYP-536", "CYP-552", "CYP-756"],
                    },
                ])
            ).to.deep.eq(["CYP-756"]);
            expect(logger.message).to.have.been.calledWithExactly(
                Level.WARNING,
                dedent(`
                    Mismatch between feature file issue tags and updated Jira issues detected

                    Issues contained in feature file tags which were not updated by Jira and might not exist:
                      CYP-123
                      CYP-42

                    Issues updated by Jira which are not present in feature file tags and might have been created:
                      CYP-536
                      CYP-552

                    Make sure that:
                    - All issues present in feature file tags belong to existing issues
                    - Your plugin tag prefix settings are consistent with the ones defined in Xray

                    More information:
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/guides/targetingExistingIssues/
                    - https://qytera-gmbh.github.io/projects/cypress-xray-plugin/section/configuration/cucumber/#prefixes
                `)
            );
        });
    });

    describe(getSummariesToReset.name, () => {
        it("returns summaries of issues to reset", () => {
            const oldSummaries: StringMap<string> = {
                ["CYP-123"]: "Old Summary",
                ["CYP-456"]: "Old Summary Too",
            };
            const newSummaries: StringMap<string> = {
                ["CYP-123"]: "New Summary",
                ["CYP-456"]: "Old Summary Too",
            };
            expect(getSummariesToReset([oldSummaries, newSummaries])).to.deep.eq({
                ["CYP-123"]: "Old Summary",
            });
        });

        it("warns about unknown old summaries", () => {
            const logger = getMockedLogger();
            const oldSummaries: StringMap<string> = {};
            const newSummaries: StringMap<string> = {
                ["CYP-123"]: "New Summary",
            };
            expect(getSummariesToReset([oldSummaries, newSummaries])).to.deep.eq({});
            expect(logger.message).to.have.been.calledWithExactly(
                Level.WARNING,
                dedent(`
                    Skipping resetting summary of issue: CYP-123
                    The previous summary could not be fetched, make sure to manually restore it if needed
                `)
            );
        });
    });

    describe(getLabelsToReset.name, () => {
        it("returns labels of issues to reset", () => {
            const oldLabels: StringMap<string[]> = {
                ["CYP-123"]: ["a tag"],
                ["CYP-456"]: ["tag 1", "tag 2"],
                ["CYP-789"]: ["another tag"],
            };
            const newLabels: StringMap<string[]> = {
                ["CYP-123"]: ["a tag"],
                ["CYP-456"]: ["tag 2"],
                ["CYP-789"]: [],
            };
            expect(getLabelsToReset([oldLabels, newLabels])).to.deep.eq({
                ["CYP-456"]: ["tag 1", "tag 2"],
                ["CYP-789"]: ["another tag"],
            });
        });

        it("warns about unknown old labels", () => {
            const logger = getMockedLogger();
            const oldLabels: StringMap<string[]> = {
                ["CYP-789"]: ["another tag"],
            };
            const newLabels: StringMap<string[]> = {
                ["CYP-123"]: ["a tag"],
                ["CYP-456"]: ["tag 1", "tag 2"],
                ["CYP-789"]: ["another tag"],
            };
            expect(getLabelsToReset([oldLabels, newLabels])).to.deep.eq({});
            expect(logger.message).to.have.been.calledWithExactly(
                Level.WARNING,
                dedent(`
                    Skipping resetting labels of issue: CYP-123
                    The previous labels could not be fetched, make sure to manually restore them if needed
                `)
            );
            expect(logger.message).to.have.been.calledWithExactly(
                Level.WARNING,
                dedent(`
                    Skipping resetting labels of issue: CYP-456
                    The previous labels could not be fetched, make sure to manually restore them if needed
                `)
            );
        });
    });
});
