import { expect } from "chai";
import path from "node:path";
import { getMockedLogger } from "../../../../test/mocks";
import { ComputableState } from "../../command";
import { ConstantCommand } from "./constant-command";
import { FallbackCommand } from "./fallback-command";

describe(path.relative(process.cwd(), __filename), () => {
    describe(FallbackCommand.name, () => {
        it("computes the result if possible", async () => {
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

        it("returns the fallback value", async () => {
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
