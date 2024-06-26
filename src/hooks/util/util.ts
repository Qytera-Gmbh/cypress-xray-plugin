import { JiraClient } from "../../client/jira/jira-client";
import { ExecutableGraph } from "../../util/graph/executable-graph";
import { Logger } from "../../util/logging";
import { Command } from "../command";
import { ExtractFieldIdCommand, JiraField } from "./commands/jira/extract-field-id-command";
import { FetchAllFieldsCommand } from "./commands/jira/fetch-all-fields-command";

export function createExtractFieldIdCommand(
    field: JiraField,
    jiraClient: JiraClient,
    graph: ExecutableGraph<Command>,
    logger: Logger
): Command<string> {
    const fetchAllFieldsCommand = graph.findOrDefault(FetchAllFieldsCommand, () =>
        graph.place(new FetchAllFieldsCommand({ jiraClient: jiraClient }, logger))
    );
    const extractFieldIdCommand = graph.findOrDefault(
        ExtractFieldIdCommand,
        () => {
            const command = graph.place(
                new ExtractFieldIdCommand({ field: field }, logger, fetchAllFieldsCommand)
            );
            graph.connect(fetchAllFieldsCommand, command);
            return command;
        },
        (command) => {
            return command.getParameters().field === field;
        }
    );
    return extractFieldIdCommand;
}
