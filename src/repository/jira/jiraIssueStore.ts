import { JiraFieldIds } from "../../types/plugin";
import { StringMap } from "../../types/util";
import { equalsIgnoreOrder } from "../../util/arrays";
import { setCoverage } from "../../util/sets";

type FieldName = keyof JiraFieldIds;

export interface Order {
    fields: FieldName[];
    issueKeys: string[];
}

interface Coverage {
    fields: FieldName[];
    covers: FieldName[][];
}

type FieldReturnTypes = {
    description: string;
    labels: string[];
    summary: string;
    testPlans: string[];
    testType: string;
};

type FieldReturns = {
    [K in keyof JiraFieldIds]: {
        kind: K;
        data: FieldReturnTypes[K];
    };
};

type FieldData = FieldReturns[keyof FieldReturns];

type IssueResponse = {
    issueKey: string;
    fields: FieldData[];
};

export abstract class JiraIssueStore {
    /**
     * Combinations of fields which can be retrieved from a single API endpoint.
     */
    private readonly combinations: FieldName[][];
    private readonly cachedCoverages: Coverage[] = [];
    private nextOrder: StringMap<FieldName[]> = {};

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
    }

    public enqueue(issueKey: string, fields: FieldName[]): void {
        if (!(issueKey in this.nextOrder)) {
            this.nextOrder[issueKey] = [];
        }
        for (const field of fields) {
            if (!this.nextOrder[issueKey].includes(field)) {
                this.nextOrder[issueKey].push(field);
            }
        }
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
}
