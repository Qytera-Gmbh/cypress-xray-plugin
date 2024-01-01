import { JiraClient } from "../client/jira/jiraClient";
import { Command } from "../commands/command";
import { ExtractFieldIdCommand, JiraField } from "../commands/jira/fields/extractFieldIdCommand";
import { FetchAllFieldsCommand } from "../commands/jira/fields/fetchAllFieldsCommand";
import { ExecutableGraph } from "../util/executable/executable";

export function createExtractFieldIdCommand(
    field: JiraField,
    jiraClient: JiraClient,
    graph: ExecutableGraph<Command>
): Command<string> {
    const fetchAllFieldsCommand = graph.findOrDefault(
        (vertex): vertex is FetchAllFieldsCommand => {
            return vertex instanceof FetchAllFieldsCommand;
        },
        () => graph.place(new FetchAllFieldsCommand(jiraClient))
    );
    const extractFieldIdCommand = graph.findOrDefault(
        (command): command is ExtractFieldIdCommand => {
            return command instanceof ExtractFieldIdCommand && command.getField() === field;
        },
        () => {
            const command = graph.place(new ExtractFieldIdCommand(field, fetchAllFieldsCommand));
            graph.connect(fetchAllFieldsCommand, command);
            return command;
        }
    );
    return extractFieldIdCommand;
}
