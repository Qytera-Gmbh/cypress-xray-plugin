import axios from "axios";
import assert from "node:assert";
import { relative } from "node:path";
import { cwd } from "node:process";
import { describe, it } from "node:test";
import { PatCredentials } from "../../../../client/authentication/credentials";
import { AxiosRestClient } from "../../../../client/https/https";
import type { XrayClient } from "../../../../client/xray/xray-client";
import { ServerClient } from "../../../../client/xray/xray-client-server";
import { dedent } from "../../../../util/dedent";
import { Level, LOG } from "../../../../util/logging";
import { ImportFeatureCommand } from "./import-feature-command";

describe(relative(cwd(), __filename), async () => {
    await describe(ImportFeatureCommand.name, async () => {
        await it("imports features", async (context) => {
            const message = context.mock.method(LOG, "message", context.mock.fn());
            const xrayClient = new ServerClient(
                "http://localhost:1234",
                new PatCredentials("token"),
                new AxiosRestClient(axios)
            );
            context.mock.method(
                xrayClient,
                "importFeature",
                context.mock.fn<XrayClient["importFeature"]>(async () => {
                    return Promise.resolve({
                        errors: [],
                        updatedOrCreatedIssues: ["CYP-123", "CYP-42"],
                    });
                })
            );
            const command = new ImportFeatureCommand(
                {
                    filePath: "/path/to/some/cucumber.feature",
                    xrayClient: xrayClient,
                },
                LOG
            );
            assert.deepStrictEqual(await command.compute(), {
                errors: [],
                updatedOrCreatedIssues: ["CYP-123", "CYP-42"],
            });
            assert.deepStrictEqual(message.mock.calls[0].arguments, [
                Level.INFO,
                "Importing feature file to Xray: /path/to/some/cucumber.feature",
            ]);
        });

        await it("warns about import errors", async (context) => {
            const message = context.mock.method(LOG, "message", context.mock.fn());
            const xrayClient = new ServerClient(
                "http://localhost:1234",
                new PatCredentials("token"),
                new AxiosRestClient(axios)
            );
            context.mock.method(
                xrayClient,
                "importFeature",
                context.mock.fn<XrayClient["importFeature"]>(async () => {
                    return Promise.resolve({
                        errors: ["CYP-123 does not exist", "CYP-42: Access denied", "Big\nProblem"],
                        updatedOrCreatedIssues: [],
                    });
                })
            );
            const command = new ImportFeatureCommand(
                {
                    filePath: "/path/to/some/cucumber.feature",
                    xrayClient: xrayClient,
                },
                LOG
            );
            await command.compute();
            assert.deepStrictEqual(message.mock.calls[1].arguments, [
                Level.WARNING,
                dedent(`
                    /path/to/some/cucumber.feature

                      Encountered errors during feature file import:
                      - CYP-123 does not exist
                      - CYP-42: Access denied
                      - Big\nProblem
                `),
            ]);
        });
    });
});
