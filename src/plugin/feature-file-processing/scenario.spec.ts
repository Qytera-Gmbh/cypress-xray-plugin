import type { Scenario } from "@cucumber/messages";
import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { parseFeatureFile } from "./gherkin";
import { getCucumberScenarioIssueTags } from "./scenario";

void describe(relative(cwd(), __filename), () => {
    void describe(getCucumberScenarioIssueTags.name, () => {
        void it("extracts scenario tags without prefix", () => {
            const feature = parseFeatureFile(
                "./test/resources/features/taggedNoPrefixMultipleScenario.feature"
            ).feature;
            // Cast because we know for certain it exists.
            const scenario = feature?.children[1].scenario as Scenario;
            assert.deepStrictEqual(getCucumberScenarioIssueTags(scenario, "CYP"), [
                "CYP-123",
                "CYP-456",
            ]);
        });

        void it("extracts scenario tags with prefix", () => {
            const feature = parseFeatureFile(
                "./test/resources/features/taggedPrefixMultipleScenario.feature"
            ).feature;
            // Cast because we know for certain it exists.
            const scenario: Scenario = feature?.children[1].scenario as Scenario;
            assert.deepStrictEqual(getCucumberScenarioIssueTags(scenario, "CYP", "TestName:"), [
                "CYP-123",
                "CYP-456",
            ]);
        });
    });
});
