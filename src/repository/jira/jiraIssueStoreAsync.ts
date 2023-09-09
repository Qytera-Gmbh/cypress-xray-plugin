import { EventEmitter } from "node:events";
import { EventReturnType, JiraFieldEventEmitter } from "../../events/jiraFieldEventEmitter";
import { JiraFieldIds } from "../../types/plugin";
import { StringMap } from "../../types/util";
import { equalsIgnoreOrder } from "../../util/arrays";
import { setCoverage } from "../../util/sets";

type FieldName = keyof JiraFieldIds;

export interface Order {
    fields: FieldName[];
    issueKeys: string[];
}

export type FieldReturnType = {
    description: string;
    labels: string[];
    summary: string;
    testPlans: string[];
    testType: string;
};

export type IssueResponse = {
    issueKey: string;
    fields: FieldData[];
};

interface Coverage {
    fields: FieldName[];
    covers: FieldName[][];
}

type FieldReturns = {
    [K in FieldName]: {
        kind: K;
        data: FieldReturnType[K];
    };
};

type FieldData = FieldReturns[keyof FieldReturns];

export abstract class JiraIssueStore {
    /**
     * Combinations of fields which can be retrieved from a single API endpoint.
     */
    private readonly combinations: FieldName[][];
    private readonly cachedCoverages: Coverage[] = [];
    private nextOrder: StringMap<FieldName[]> = {};

    private readonly orderEmitter: EventEmitter = new EventEmitter();
    private readonly fieldEmitter: JiraFieldEventEmitter = new JiraFieldEventEmitter();
    private static readonly EVENT_ORDER_CONCLUDED = "concluded";

    constructor(combinations: FieldName[][]) {
        this.combinations = combinations;
    }

    public async checkout(): Promise<void> {
        const bulkOrders: Order[] = [];
        Object.entries(this.nextOrder).forEach(([issueKey, fields]) => {
            const fieldCombinations = this.getCombinations(fields);
            for (const fieldCombination of fieldCombinations) {
                this.mergeOrders(issueKey, fieldCombination, bulkOrders);
            }
        });
        this.nextOrder = {};
        const issueResponses = await Promise.all(
            bulkOrders.map(async (order: Order) => await this.checkoutIssues(order))
        );
        for (const mergedResponse of issueResponses) {
            for (const issueResponse of mergedResponse) {
                for (const field of issueResponse.fields) {
                    this.fieldEmitter.emit(issueResponse.issueKey, field.kind, field.data);
                }
            }
        }
        this.orderEmitter.emit(JiraIssueStore.EVENT_ORDER_CONCLUDED);
    }

    public async order<T extends FieldName>(
        field: T,
        ...issueKeys: string[]
    ): Promise<StringMap<FieldReturnType[T]>> {
        const fieldData: StringMap<FieldReturnType[T]> = {};
        const futureResponses: Promise<void>[] = [];
        for (const issueKey of issueKeys) {
            if (!(issueKey in this.nextOrder)) {
                this.nextOrder[issueKey] = [];
            }
            if (!this.nextOrder[issueKey].includes(field)) {
                this.nextOrder[issueKey].push(field);
            }
            futureResponses.push(this.fetchField(field, issueKey, fieldData));
        }
        await Promise.allSettled(futureResponses);
        return fieldData;
    }

    protected abstract checkoutIssues(order: Order): Promise<IssueResponse[]>;

    private getCombinations(fields: FieldName[]): FieldName[][] {
        for (const cachedCoverage of this.cachedCoverages) {
            if (equalsIgnoreOrder(cachedCoverage.fields, fields)) {
                return cachedCoverage.covers;
            }
        }
        const fieldCoverageSets = setCoverage(fields, ...this.combinations);
        this.cachedCoverages.push({
            fields: [...fields],
            covers: [...fieldCoverageSets],
        });
        return fieldCoverageSets;
    }

    private mergeOrders(issueKey: string, fields: FieldName[], orders: Order[]) {
        for (const bulkOrder of orders) {
            if (equalsIgnoreOrder(bulkOrder.fields, fields)) {
                bulkOrder.issueKeys.push(issueKey);
                return;
            }
        }
        orders.push({
            fields: [...fields],
            issueKeys: [issueKey],
        });
    }

    private async fetchField<T extends FieldName>(
        field: T,
        issueKey: string,
        fieldData: StringMap<FieldReturnType[T]>
    ): Promise<void> {
        const onFieldReceivedEvent = (eventData: EventReturnType[T]) => {
            if (eventData.issueKey === issueKey) {
                this.orderEmitter.off(field, onFieldReceivedEvent);
                this.orderEmitter.off(JiraIssueStore.EVENT_ORDER_CONCLUDED, onOrderConcludedEvent);
                fieldData[issueKey] = eventData.data;
            }
        };
        const onOrderConcludedEvent = () => {
            this.fieldEmitter.off(field, onFieldReceivedEvent);
            this.orderEmitter.off(JiraIssueStore.EVENT_ORDER_CONCLUDED, onOrderConcludedEvent);
            throw new Error("BLABLA");
        };
        this.fieldEmitter.on(field, onFieldReceivedEvent);
        this.orderEmitter.on(JiraIssueStore.EVENT_ORDER_CONCLUDED, onOrderConcludedEvent);
    }
}
