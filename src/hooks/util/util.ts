import type { JiraClient } from "../../client/jira/jira-client.js";
import type { ExecutableGraph } from "../../util/graph/executable-graph.js";
import type { Logger } from "../../util/logging.js";
import type { Command } from "../command.js";
import { ConstantCommand } from "./commands/constant-command.js";
import type { JiraField } from "./commands/jira/extract-field-id-command.js";
import { ExtractFieldIdCommand } from "./commands/jira/extract-field-id-command.js";
import { FetchAllFieldsCommand } from "./commands/jira/fetch-all-fields-command.js";

export function getOrCreateConstantCommand<T>(
    graph: ExecutableGraph<Command>,
    logger: Logger,
    value: T
): ConstantCommand<T> {
    for (const command of graph.getVertices()) {
        if (command instanceof ConstantCommand) {
            if (command.getValue() === value && command.getLogger() === logger) {
                // Cast valid because of value equality.
                return command as ConstantCommand<T>;
            }
        }
    }
    return graph.place(new ConstantCommand(logger, value));
}

export function getOrCreateExtractFieldIdCommand(
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
