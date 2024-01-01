import { JiraClient } from "../client/jira/jiraClient";
import { ExecutableGraph } from "../util/executable/executable";
import { Command } from "./command";
import {
    ExtractFieldIdCommand,
    JiraField,
} from "./preprocessor/commands/jira/extractFieldIdCommand";
import { FetchAllFieldsCommand } from "./preprocessor/commands/jira/fetchAllFieldsCommand";

export class ConstantCommand<R> extends Command<R> {
    private readonly value: R;
    constructor(value: R) {
        super();
        this.value = value;
    }

    public getValue(): R {
        return this.value;
    }

    protected computeResult(): Promise<R> {
        return new Promise((resolve) => {
            resolve(this.getValue());
        });
    }
}

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
