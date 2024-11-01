import { expect } from "chai";
import { describe, it } from "node:test";
import { relative } from "path";
import { getMockedLogger } from "../../../../test/mocks.js";
import { ComputableState } from "../../command.js";
import { ConstantCommand } from "./constant-command.js";
import { FallbackCommand } from "./fallback-command.js";

await describe(relative(process.cwd(), import.meta.filename), async () => {
    await describe(FallbackCommand.name, async () => {
        await it("computes the result if possible", async () => {
            const logger = getMockedLogger();
            const input = new ConstantCommand(logger, 42);
            const command = new FallbackCommand(
                {
                    fallbackOn: [ComputableState.FAILED],
                    fallbackValue: "fallback",
                },
                logger,
                input
            );
            expect(await command.compute()).to.eq(42);
        });

        await it("returns the fallback value", async () => {
            const logger = getMockedLogger();
            const input = new ConstantCommand(logger, 42);
            const command = new FallbackCommand(
                {
                    fallbackOn: [ComputableState.FAILED],
                    fallbackValue: "fallback",
                },
                logger,
                input
            );
            input.setState(ComputableState.FAILED);
            expect(await command.compute()).to.eq("fallback");
        });
    });
});
