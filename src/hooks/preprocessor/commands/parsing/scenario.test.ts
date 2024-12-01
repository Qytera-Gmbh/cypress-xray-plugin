import type { Scenario } from "@cucumber/messages";
import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { parseFeatureFile } from "./gherkin.js";
import { getCucumberScenarioIssueTags } from "./scenario.js";

await describe(relative(cwd(), import.meta.filename), async () => {
    await describe(getCucumberScenarioIssueTags.name, async () => {
        await it("extracts scenario tags without prefix", () => {
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

        await it("extracts scenario tags with prefix", () => {
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
