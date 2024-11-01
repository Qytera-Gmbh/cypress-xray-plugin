import type { Scenario } from "@cucumber/messages";
import { expect } from "chai";
import { describe, it } from "node:test";
import { relative } from "path";
import { parseFeatureFile } from "./gherkin.js";
import { getCucumberScenarioIssueTags } from "./scenario.js";

await describe(relative(process.cwd(), import.meta.filename), async () => {
    await describe(getCucumberScenarioIssueTags.name, async () => {
        await it("extracts scenario tags without prefix", () => {
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

        await it("extracts scenario tags with prefix", () => {
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
