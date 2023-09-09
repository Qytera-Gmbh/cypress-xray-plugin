import { logDebug, logError, logInfo } from "../logging/logging";
import {
    FeatureFileIssueData,
    FeatureFileIssueDataTest,
    getCucumberIssueData,
} from "../preprocessing/preprocessing";
import { IssueUpdateCloud, IssueUpdateServer } from "../types/jira/responses/issueUpdate";
import { ClientCombination, InternalOptions } from "../types/plugin";
import { StringMap } from "../types/util";
import { dedent } from "../util/dedent";
import { Command } from "./command";

export class ImportFeaturesCommand extends Command {
    private readonly options: InternalOptions;
    private readonly projectRoot: string;
    private readonly clients: ClientCombination;

    private readonly issueData: StringMap<FeatureFileIssueData> = {};

    constructor(options: InternalOptions, projectRoot: string, clients: ClientCombination) {
        super();
        this.options = options;
        this.projectRoot = projectRoot;
        this.clients = clients;
    }

    public addFeature(file: Cypress.FileObject) {
        const issueData = getCucumberIssueData(
            file.filePath,
            this.options,
            this.clients.kind === "cloud"
        );
        this.issueData[file.filePath] = issueData;
    }

    public async execute(): Promise<void> {
        // Xray currently (almost) always overwrites issue summaries when importing feature
        // files to existing issues. Therefore, we manually need to backup and reset the
        // summary once the import is done.
        // See: https://docs.getxray.app/display/XRAY/Importing+Cucumber+Tests+-+REST
        // See: https://docs.getxray.app/display/XRAYCLOUD/Importing+Cucumber+Tests+-+REST+v2
        Object.entries(this.issueData).forEach(async ([filePath, issueData]) => {
            const issueKeys = [
                ...issueData.tests.map((data) => data.key),
                ...issueData.preconditions.map((data) => data.key),
            ];
            logDebug(
                dedent(`
                    Creating issue summary backups for issues:
                      ${issueKeys.join("\n")}
                `)
            );
            const testSummaries = await this.clients.jiraRepository.getSummaries(...issueKeys);
            const testLabels = await this.clients.jiraRepository.getLabels(...issueKeys);
            logInfo("Importing feature file to Xray...");
            const wasImportSuccessful = await this.clients.xrayClient.importFeature(
                filePath,
                this.options.jira.projectKey
            );
            if (wasImportSuccessful) {
                await this.resetSummaries(issueData, testSummaries);
                await this.resetLabels(issueData.tests, testLabels);
            }
        });
    }

    public async resetSummaries(issueData: FeatureFileIssueData, testSummaries: StringMap<string>) {
        const allIssues = [...issueData.tests, ...issueData.preconditions];
        for (let i = 0; i < allIssues.length; i++) {
            const issueKey = allIssues[i].key;
            const oldSummary = testSummaries[issueKey];
            const newSummary = allIssues[i].summary;
            if (!newSummary) {
                logDebug(
                    `Feature child does not have a name, issue summary will not be overwritten: ${issueKey}`
                );
            } else if (oldSummary !== newSummary) {
                const issueUpdate: IssueUpdateServer | IssueUpdateCloud = {};
                const summaryFieldId = await this.clients.jiraRepository.getFieldId(
                    "Summary",
                    "summary"
                );
                if (issueUpdate.fields) {
                    issueUpdate.fields[summaryFieldId] = oldSummary;
                } else {
                    issueUpdate.fields = {
                        summaryFieldId: oldSummary,
                    };
                }
                logDebug(
                    dedent(`
                        Resetting issue summary of issue: ${issueKey}

                          Summary pre sync:  ${oldSummary}
                          Summary post sync: ${newSummary}
                    `)
                );
                if (!(await this.clients.jiraClient.editIssue(issueKey, issueUpdate))) {
                    logError(
                        dedent(`
                            Failed to reset issue summary of issue to its old summary: ${issueKey}

                              Summary pre sync:  ${oldSummary}
                              Summary post sync: ${newSummary}

                            Make sure to reset it manually if needed
                        `)
                    );
                }
            } else {
                logDebug(
                    dedent(`
                        Issue summary is identical to scenario (outline) or background name already: ${issueKey}

                          Summary: ${oldSummary}
                    `)
                );
            }
        }
    }

    public async resetLabels(
        issueData: FeatureFileIssueDataTest[],
        testLabels: StringMap<string[]>
    ) {
        for (let i = 0; i < issueData.length; i++) {
            const issueKey = issueData[i].key;
            const oldLabels = testLabels[issueKey];
            const newLabels = issueData[i].tags;
            if (!newLabels.every((label) => oldLabels.includes(label))) {
                const issueUpdate: IssueUpdateServer | IssueUpdateCloud = {};
                const labelFieldId = await this.clients.jiraRepository.getFieldId(
                    "Labels",
                    "labels"
                );
                if (issueUpdate.fields) {
                    issueUpdate.fields[labelFieldId] = oldLabels;
                } else {
                    issueUpdate.fields = {
                        labelFieldId: oldLabels,
                    };
                }
                logDebug(
                    dedent(`
                        Resetting issue labels of issue: ${issueKey}

                          Labels pre sync:  ${oldLabels}
                          Labels post sync: ${newLabels}
                    `)
                );
                if (!(await this.clients.jiraClient.editIssue(issueKey, issueUpdate))) {
                    logError(
                        dedent(`
                            Failed to reset issue labels of issue to its old labels: ${issueKey}

                              Labels pre sync:  ${oldLabels}
                              Labels post sync: ${newLabels}

                            Make sure to reset them manually if needed
                        `)
                    );
                }
            } else {
                logDebug(
                    dedent(`
                        Issue labels contain all scenario (outline) labels already: ${issueKey}

                        Issue labels:              [${oldLabels.join(" ")}]
                        Scenario (outline) labels: [${newLabels.join(" ")}]
                    `)
                );
            }
        }
    }
}
