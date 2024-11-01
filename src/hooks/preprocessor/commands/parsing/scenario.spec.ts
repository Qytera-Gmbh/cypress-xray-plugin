import type { Scenario } from "@cucumber/messages";
import { expect } from "chai";
import path from "path";
import { parseFeatureFile } from "./gherkin";
import { getCucumberScenarioIssueTags } from "./scenario";

describe(path.relative(process.cwd(), __filename), () => {
    describe(getCucumberScenarioIssueTags.name, () => {
        it("extracts scenario tags without prefix", () => {
            const feature = parseFeatureFile(
                "./test/resources/features/taggedNoPrefixMultipleScenario.feature"
            ).feature;
            // Cast because we know for certain it exists.
            const scenario = feature?.children[1].scenario as Scenario;
            expect(getCucumberScenarioIssueTags(scenario, "CYP")).to.deep.eq([
                "CYP-123",
                "CYP-456",
            ]);
        });

        it("extracts scenario tags with prefix", () => {
            const feature = parseFeatureFile(
                "./test/resources/features/taggedPrefixMultipleScenario.feature"
            ).feature;
            // Cast because we know for certain it exists.
            const scenario: Scenario = feature?.children[1].scenario as Scenario;
            expect(getCucumberScenarioIssueTags(scenario, "CYP", "TestName:")).to.deep.eq([
                "CYP-123",
                "CYP-456",
            ]);
        });
    });
});
