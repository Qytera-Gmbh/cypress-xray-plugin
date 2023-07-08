/// <reference types="cypress" />

import { expect } from "chai";
import fs from "fs";
import { configureXrayPlugin } from "../../plugin";
import { Options } from "../../src/types/plugin";
import { stubLogInfo } from "../constants";

describe("the plugin configuration", () => {
    const config: Cypress.PluginConfigOptions = JSON.parse(
        fs.readFileSync("./test/resources/cypress.config.json", "utf-8")
    );

    it("should not verify if disabled", async () => {
        const stubbedInfo = stubLogInfo();
        const options: Options = {
            jira: {
                projectKey: "CYP",
            },
            plugin: {
                enabled: false,
            },
        };
        options.plugin.enabled = false;
        await configureXrayPlugin(config, options);
        expect(stubbedInfo).to.have.been.calledOnce;
        expect(stubbedInfo).to.have.been.calledWith(
            "Plugin disabled. Skipping configuration verification."
        );
    });
});
