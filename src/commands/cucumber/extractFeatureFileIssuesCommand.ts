import { GherkinDocument } from "@cucumber/messages";
import {
    FeatureFileIssueData,
    getCucumberPreconditionIssueComments,
    getCucumberPreconditionIssueTags,
    getCucumberScenarioIssueTags,
} from "../../preprocessing/preprocessing";
import { CucumberOptions } from "../../types/plugin";
import { Command, Computable } from "../../util/command/command";
import {
    missingPreconditionKeyInCucumberBackgroundError,
    missingTestKeyInCucumberScenarioError,
    multiplePreconditionKeysInCucumberBackgroundError,
    multipleTestKeysInCucumberScenarioError,
} from "../../util/errors";

export class ExtractFeatureFileTagsCommand extends Command<FeatureFileIssueData> {
    constructor(
        private readonly document: Computable<GherkinDocument>,
        private readonly projectKey: string,
        private readonly prefixes: CucumberOptions["prefixes"],
        private readonly displayCloudHelp: boolean
    ) {
        super();
        this.document = document;
        this.projectKey = projectKey;
        this.prefixes = prefixes;
        this.displayCloudHelp = displayCloudHelp;
    }

    public getProjectKey(): string {
        return this.projectKey;
    }

    public getPrefixes(): CucumberOptions["prefixes"] {
        return this.prefixes;
    }

    protected async computeResult(): Promise<FeatureFileIssueData> {
        const parsedDocument = await this.document.getResult();
        const featureFileIssueKeys: FeatureFileIssueData = {
            tests: [],
            preconditions: [],
        };
        if (parsedDocument.feature?.children) {
            for (const child of parsedDocument.feature.children) {
                if (child.scenario) {
                    const issueKeys = getCucumberScenarioIssueTags(
                        child.scenario,
                        this.projectKey,
                        this.prefixes?.test
                    );
                    if (issueKeys.length === 0) {
                        throw missingTestKeyInCucumberScenarioError(
                            child.scenario,
                            this.projectKey,
                            this.displayCloudHelp
                        );
                    } else if (issueKeys.length > 1) {
                        throw multipleTestKeysInCucumberScenarioError(
                            child.scenario,
                            child.scenario.tags,
                            issueKeys,
                            this.displayCloudHelp
                        );
                    }
                    featureFileIssueKeys.tests.push({
                        key: issueKeys[0],
                        summary: child.scenario.name ? child.scenario.name : "<empty>",
                        tags: child.scenario.tags.map((tag) => tag.name.replace("@", "")),
                    });
                } else if (child.background) {
                    const preconditionComments = getCucumberPreconditionIssueComments(
                        child.background,
                        this.projectKey,
                        parsedDocument.comments
                    );
                    const preconditionKeys = getCucumberPreconditionIssueTags(
                        child.background,
                        this.projectKey,
                        preconditionComments,
                        this.prefixes?.precondition
                    );
                    if (preconditionKeys.length === 0) {
                        throw missingPreconditionKeyInCucumberBackgroundError(
                            child.background,
                            this.projectKey,
                            this.displayCloudHelp,
                            preconditionComments
                        );
                    } else if (preconditionKeys.length > 1) {
                        throw multiplePreconditionKeysInCucumberBackgroundError(
                            child.background,
                            preconditionKeys,
                            parsedDocument.comments,
                            this.displayCloudHelp
                        );
                    }
                    featureFileIssueKeys.preconditions.push({
                        key: preconditionKeys[0],
                        summary: child.background.name ? child.background.name : "<empty>",
                    });
                }
            }
        }
        return featureFileIssueKeys;
    }
}
