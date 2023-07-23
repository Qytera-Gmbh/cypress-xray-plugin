import { expect } from "chai";
import fs from "fs";
import { stubLogging } from "../test/util";
import { configureXrayPlugin } from "./plugin";
import { Options } from "./types/plugin";

describe("the plugin configuration", () => {
    const config: Cypress.PluginConfigOptions = JSON.parse(
        fs.readFileSync("./test/resources/cypress.config.json", "utf-8")
    );

    it("should not verify if disabled", async () => {
        const { stubbedInfo } = stubLogging();
        const options: Options = {
            jira: {
                projectKey: "CYP",
                url: "https://example.org",
            },
            plugin: {
                enabled: false,
            },
        };
        await configureXrayPlugin(config, options);
        expect(stubbedInfo).to.have.been.calledOnce;
        expect(stubbedInfo).to.have.been.calledWith(
            "Plugin disabled. Skipping configuration verification."
        );
    });
});
