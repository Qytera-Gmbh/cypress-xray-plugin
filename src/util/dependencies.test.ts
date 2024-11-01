import assert from "node:assert";
import { describe, it } from "node:test";
import { relative } from "path";
import * as dependencies from "./dependencies.js";

await describe(relative(process.cwd(), import.meta.filename), async () => {
    await it("throws if a package is not installed", async () => {
        await assert.rejects(dependencies.importOptionalDependency("nonexistent"), {
            message: `Cannot find package 'nonexistent' imported from ${path.resolve(
                ".",
                "src",
                "util",
                "dependencies.ts"
            )}`,
        });
    });

    await it("imports @badeball/cypress-cucumber-preprocessor", async () => {
        const members: Record<string, unknown> = await dependencies.importOptionalDependency(
            "@badeball/cypress-cucumber-preprocessor"
        );
        assert.ok(members.resolvePreprocessorConfiguration !== undefined);
    });
});
