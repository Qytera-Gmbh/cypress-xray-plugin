import { JiraClient } from "../../client/jira/jira-client";
import { ExecutableGraph } from "../../util/graph/executable";
import { Command } from "../command";
import { ExtractFieldIdCommand, JiraField } from "./commands/jira/extract-field-id-command";
import { FetchAllFieldsCommand } from "./commands/jira/fetch-all-fields-command";

export function createExtractFieldIdCommand(
    field: JiraField,
    jiraClient: JiraClient,
    graph: ExecutableGraph<Command>
): Command<string> {
    const fetchAllFieldsCommand = graph.findOrDefault(
        (vertex): vertex is FetchAllFieldsCommand => {
            return vertex instanceof FetchAllFieldsCommand;
        },
        () => graph.place(new FetchAllFieldsCommand({ jiraClient: jiraClient }))
    );
    const extractFieldIdCommand = graph.findOrDefault(
        (command): command is ExtractFieldIdCommand => {
            return (
                command instanceof ExtractFieldIdCommand && command.getParameters().field === field
            );
        },
        () => {
            const command = graph.place(
                new ExtractFieldIdCommand({ field: field }, fetchAllFieldsCommand)
            );
            graph.connect(fetchAllFieldsCommand, command);
            return command;
        }
    );
    return extractFieldIdCommand;
}
