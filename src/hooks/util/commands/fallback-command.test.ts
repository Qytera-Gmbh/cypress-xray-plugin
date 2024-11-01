import { expect } from "chai";
import { describe, it } from "node:test";
import path from "path";
import { getMockedLogger } from "../../../../test/mocks.js";
import { ComputableState } from "../../command.js";
import { ConstantCommand } from "./constant-command.js";
import { FallbackCommand } from "./fallback-command.js";

await describe(path.relative(process.cwd(), import.meta.filename), () => {
    await describe(FallbackCommand.name, () => {
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
