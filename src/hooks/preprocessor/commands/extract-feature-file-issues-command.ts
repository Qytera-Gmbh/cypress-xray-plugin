import { Background, GherkinDocument, Scenario } from "@cucumber/messages";
import { FeatureFileIssueData } from "../../../types/cucumber/cucumber";
import { CucumberOptions } from "../../../types/plugin";
import {
    missingPreconditionKeyInCucumberBackgroundError,
    missingTestKeyInCucumberScenarioError,
    multiplePreconditionKeysInCucumberBackgroundError,
    multipleTestKeysInCucumberScenarioError,
} from "../../../util/errors";
import { Command, Computable } from "../../command";
import {
    getCucumberPreconditionIssueComments,
    getCucumberPreconditionIssueTags,
} from "./parsing/precondition";
import { getCucumberScenarioIssueTags } from "./parsing/scenario";

interface Parameters {
    readonly projectKey: string;
    readonly prefixes: CucumberOptions["prefixes"];
    readonly displayCloudHelp: boolean;
}

export class ExtractFeatureFileIssuesCommand extends Command<FeatureFileIssueData> {
    private readonly parameters: Parameters;
    private readonly document: Computable<GherkinDocument>;
    constructor(parameters: Parameters, document: Computable<GherkinDocument>) {
        super();
        this.parameters = parameters;
        this.document = document;
    }

    public getParameters(): Parameters {
        return this.parameters;
    }

    protected async computeResult(): Promise<FeatureFileIssueData> {
        const parsedDocument = await this.document.compute();
        const featureFileIssueKeys: FeatureFileIssueData = {
            tests: [],
            preconditions: [],
        };
        const backgrounds: Background[] = [];
        const scenarios: Scenario[] = [];
        if (parsedDocument.feature?.children) {
            for (const child of parsedDocument.feature.children) {
                if (child.scenario) {
                    scenarios.push(child.scenario);
                }
                if (child.background) {
                    backgrounds.push(child.background);
                }
                if (child.rule) {
                    for (const ruleChild of child.rule.children) {
                        if (ruleChild.scenario) {
                            scenarios.push(ruleChild.scenario);
                        }
                        if (ruleChild.background) {
                            backgrounds.push(ruleChild.background);
                        }
                    }
                }
            }
        }
        for (const background of backgrounds) {
            const preconditionComments = getCucumberPreconditionIssueComments(
                background,
                parsedDocument.comments
            );
            const preconditionKeys = getCucumberPreconditionIssueTags(
                background,
                this.parameters.projectKey,
                preconditionComments,
                this.parameters.prefixes?.precondition
            );
            if (preconditionKeys.length === 0) {
                throw missingPreconditionKeyInCucumberBackgroundError(
                    background,
                    this.parameters.projectKey,
                    this.parameters.displayCloudHelp,
                    preconditionComments
                );
            } else if (preconditionKeys.length > 1) {
                throw multiplePreconditionKeysInCucumberBackgroundError(
                    background,
                    preconditionKeys,
                    parsedDocument.comments,
                    this.parameters.displayCloudHelp
                );
            }
            featureFileIssueKeys.preconditions.push({
                key: preconditionKeys[0],
                summary: background.name,
            });
        }
        for (const scenario of scenarios) {
            const issueKeys = getCucumberScenarioIssueTags(
                scenario,
                this.parameters.projectKey,
                this.parameters.prefixes?.test
            );
            if (issueKeys.length === 0) {
                throw missingTestKeyInCucumberScenarioError(
                    scenario,
                    this.parameters.projectKey,
                    this.parameters.displayCloudHelp
                );
            } else if (issueKeys.length > 1) {
                throw multipleTestKeysInCucumberScenarioError(
                    scenario,
                    scenario.tags,
                    issueKeys,
                    this.parameters.displayCloudHelp
                );
            }
            featureFileIssueKeys.tests.push({
                key: issueKeys[0],
                summary: scenario.name,
                tags: scenario.tags.map((tag) => tag.name.replace("@", "")),
            });
        }
        return featureFileIssueKeys;
    }
}
