import { EventEmitter } from "node:events";
import { FieldReturnType } from "../repository/jira/jiraIssueStoreAsync";
import { JiraFieldIds } from "../types/plugin";

export type EventReturnType = {
    [K in keyof FieldReturnType]: {
        issueKey: string;
        data: FieldReturnType[K];
    };
};

export class JiraFieldEventEmitter {
    private readonly eventEmitter: EventEmitter = new EventEmitter();

    public emit<T extends keyof JiraFieldIds>(
        issueKey: string,
        field: T,
        data: FieldReturnType[T]
    ): void {
        this.eventEmitter.emit(field, {
            issueKey: issueKey,
            data: data,
        });
    }

    public on<T extends keyof JiraFieldIds>(
        field: T,
        listener: (data: EventReturnType[T]) => void
    ) {
        this.eventEmitter.on(field, listener);
    }

    public off<T extends keyof JiraFieldIds>(
        field: T,
        listener: (data: EventReturnType[T]) => void
    ) {
        this.eventEmitter.off(field, listener);
    }
}
