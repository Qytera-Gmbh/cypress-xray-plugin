import { expect } from "chai";
import path from "path";
import { ComputableState } from "../../command";
import { ConstantCommand } from "./constant-command";
import { FallbackCommand } from "./fallback-command";

describe(path.relative(process.cwd(), __filename), () => {
    describe(FallbackCommand.name, () => {
        it("computes the result if possible", async () => {
            const input = new ConstantCommand(42);
            const command = new FallbackCommand(
                {
                    fallbackOn: [ComputableState.FAILED],
                    fallbackValue: "fallback",
                },
                input
            );
            expect(await command.compute()).to.eq(42);
        });

        it("returns the fallback value", async () => {
            const input = new ConstantCommand(42);
            const command = new FallbackCommand(
                {
                    fallbackOn: [ComputableState.FAILED],
                    fallbackValue: "fallback",
                },
                input
            );
            input.setState(ComputableState.FAILED);
            expect(await command.compute()).to.eq("fallback");
        });
    });
});
