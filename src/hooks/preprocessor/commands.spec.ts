import { expect } from "chai";
import path from "path";
import { getMockedLogger, getMockedXrayClient } from "../../../test/mocks";
import { Level } from "../../logging/logging";
import { FeatureFileIssueData } from "../../preprocessing/preprocessing";
import { ImportFeatureResponse } from "../../types/xray/responses/importFeature";
import { dedent } from "../../util/dedent";
import { gatherAllIssueKeys, getActualAffectedIssueKeys } from "./commands";

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
});
