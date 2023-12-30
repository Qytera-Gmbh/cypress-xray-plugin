import { CombineCommand } from "../../commands/combineCommand";
import { Computable, SkippedError } from "../../commands/command";
import { FunctionCommand } from "../../commands/functionCommand";
import { LOG, Level } from "../../logging/logging";
import { IssueTypeDetails } from "../../types/jira/responses/issueTypeDetails";
import {
    XrayTest,
    XrayTestExecutionInfo,
    XrayTestExecutionResults,
} from "../../types/xray/importTestExecutionResults";
import {
    CucumberMultipart,
    CucumberMultipartFeature,
} from "../../types/xray/requests/importExecutionCucumberMultipart";
import { CucumberMultipartInfo } from "../../types/xray/requests/importExecutionCucumberMultipartInfo";
import { dedent } from "../../util/dedent";
import { HELP } from "../../util/help";

export class CombineCypressJsonCommand extends CombineCommand<
    [Computable<[XrayTest, ...XrayTest[]]>, Computable<XrayTestExecutionInfo>],
    XrayTestExecutionResults
> {
    constructor(
        parameters: {
            testExecutionIssueKey?: string;
        },
        cypressTestsJson: Computable<[XrayTest, ...XrayTest[]]>,
        cypressTestsInfo: Computable<XrayTestExecutionInfo>
    ) {
        super(
            ([tests, info]): XrayTestExecutionResults => {
                return {
                    info: info,
                    tests: tests,
                    testExecutionKey: parameters.testExecutionIssueKey,
                };
            },
            cypressTestsJson,
            cypressTestsInfo
        );
    }
}

export class AssertCypressConversionValidCommand extends FunctionCommand<
    XrayTestExecutionResults,
    void
> {
    constructor(cypressJson: Computable<XrayTestExecutionResults>) {
        super((input: XrayTestExecutionResults) => {
            if (!input.tests || input.tests.length === 0) {
                throw new SkippedError(
                    "No native Cypress tests were executed. Skipping native upload."
                );
            }
        }, cypressJson);
    }
}

export class VerifyExecutionIssueKeyCommand extends FunctionCommand<string, string> {
    constructor(
        parameters: {
            testExecutionIssueKey: string;
            testExecutionIssueType: string;
            importType: "cypress" | "cucumber";
        },
        resolvedExecutionIssue: Computable<string>
    ) {
        super((resolvedExecutionIssueKey: string) => {
            if (resolvedExecutionIssueKey !== parameters.testExecutionIssueKey) {
                LOG.message(
                    Level.WARNING,
                    dedent(`
                        ${
                            parameters.importType === "cypress" ? "Cypress" : "Cucumber"
                        } execution results were imported to test execution ${resolvedExecutionIssueKey}, which is different from the configured one: ${
                        parameters.testExecutionIssueKey
                    }

                        Make sure issue ${
                            parameters.testExecutionIssueKey
                        } actually exists and is of type: ${parameters.testExecutionIssueType}
                    `)
                );
            }
            return resolvedExecutionIssueKey;
        }, resolvedExecutionIssue);
    }
}

export class CombineCucumberMultipartCommand extends CombineCommand<
    [Computable<CucumberMultipartInfo>, Computable<CucumberMultipartFeature[]>],
    CucumberMultipart
> {
    constructor(
        cucumberMultipartInfo: Computable<CucumberMultipartInfo>,
        cucumberMultipartFeatures: Computable<CucumberMultipartFeature[]>
    ) {
        super(
            ([info, features]): CucumberMultipart => {
                return {
                    info: info,
                    features: features,
                };
            },
            cucumberMultipartInfo,
            cucumberMultipartFeatures
        );
    }
}

export class AssertCucumberConversionValidCommand extends FunctionCommand<CucumberMultipart, void> {
    constructor(features: Computable<CucumberMultipart>) {
        super((input: CucumberMultipart) => {
            if (input.features.length === 0) {
                throw new SkippedError(
                    "No Cucumber tests were executed. Skipping Cucumber upload."
                );
            }
        }, features);
    }
}

export class CompareCypressCucumberKeysCommand extends CombineCommand<
    [Computable<string>, Computable<string>],
    string
> {
    constructor(
        resolvedCypressIssueKey: Computable<string>,
        resolvedCucumberIssueKey: Computable<string>
    ) {
        super(
            ([issueKeyCypress, issueKeyCucumber]) => {
                if (issueKeyCypress !== issueKeyCucumber) {
                    LOG.message(
                        Level.WARNING,
                        dedent(`
                            Cucumber execution results were imported to test execution issue ${issueKeyCucumber}, which is different than the one of the Cypress execution results: ${issueKeyCypress}

                            This might be a bug, please report it at: https://github.com/Qytera-Gmbh/cypress-xray-plugin/issues
                        `)
                    );
                    return issueKeyCypress;
                }
                return issueKeyCypress;
            },
            resolvedCypressIssueKey,
            resolvedCucumberIssueKey
        );
    }
}

export class PrintUploadSuccessCommand extends FunctionCommand<string, void> {
    constructor(parameters: { url: string }, resolvedExecutionIssueKey: Computable<string>) {
        super((issueKey: string) => {
            LOG.message(
                Level.SUCCESS,
                `Uploaded test results to issue: ${issueKey} (${parameters.url}/browse/${issueKey})`
            );
        }, resolvedExecutionIssueKey);
    }
}

export class ExtractVideoFilesCommand extends CombineCommand<
    [Computable<CypressCommandLine.CypressRunResult>, Computable<string>],
    string[]
> {
    constructor(
        cypressRunResult: Computable<CypressCommandLine.CypressRunResult>,
        resolvedExecutionIssueKey: Computable<string>
    ) {
        super(
            ([results, testExecutionIssueKey]) => {
                const videos = results.runs
                    .map((run: CypressCommandLine.RunResult) => {
                        return run.video;
                    })
                    .filter((value): value is string => typeof value === "string");
                if (videos.length === 0) {
                    throw new SkippedError(
                        `Skipping attaching videos to test execution issue ${testExecutionIssueKey}: No videos were captured`
                    );
                } else {
                    LOG.message(
                        Level.INFO,
                        `Attaching videos to text execution issue ${testExecutionIssueKey}`
                    );
                }
                return videos;
            },
            cypressRunResult,
            resolvedExecutionIssueKey
        );
    }
}

export class FetchExecutionIssueDetailsCommand extends FunctionCommand<
    IssueTypeDetails[],
    IssueTypeDetails
> {
    constructor(
        parameters: { projectKey: string; testExecutionIssueType: string },
        allIssueTypes: Computable<IssueTypeDetails[]>
    ) {
        super((issueDetails: IssueTypeDetails[]) => {
            const details = issueDetails.filter(
                (issueDetail) => issueDetail.name === parameters.testExecutionIssueType
            );
            if (details.length === 0) {
                throw new Error(
                    dedent(`
                        Failed to retrieve issue type information for issue type: ${parameters.testExecutionIssueType}

                        Make sure you have Xray installed.

                        For more information, visit:
                        - ${HELP.plugin.configuration.jira.testExecutionIssueType}
                        - ${HELP.plugin.configuration.jira.testPlanIssueType}
                    `)
                );
            } else if (details.length > 1) {
                throw new Error(
                    dedent(`
                        Found multiple issue types named: ${parameters.testExecutionIssueType}

                        Make sure to only make a single one available in project ${parameters.projectKey}.

                        For more information, visit:
                        - ${HELP.plugin.configuration.jira.testExecutionIssueType}
                        - ${HELP.plugin.configuration.jira.testPlanIssueType}
                    `)
                );
            }
            return details[0];
        }, allIssueTypes);
    }
}
