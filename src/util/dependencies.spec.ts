import assert from "node:assert";
import { relative, resolve } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import dependencies from "./dependencies";

void describe(relative(cwd(), __filename), () => {
    void it("throws if a package is not installed", async () => {
        await assert.rejects(dependencies.importOptionalDependency("nonexistent"), {
            message: `Cannot find package 'nonexistent' imported from ${resolve(
                ".",
                "src",
                "util",
                "dependencies.ts"
            )}`,
        });
    });

    void it("imports @badeball/cypress-cucumber-preprocessor", async () => {
        const members: Record<string, unknown> = await dependencies.importOptionalDependency(
            "@badeball/cypress-cucumber-preprocessor"
        );
        assert.ok(members.resolvePreprocessorConfiguration !== undefined);
    });
});
