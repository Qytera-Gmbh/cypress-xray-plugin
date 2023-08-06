import { JiraFieldIds } from "../../../types/plugin";
import {
    FieldExtractor,
    JiraIssueFieldRepository,
    STRING_EXTRACTOR,
} from "../jiraIssueFieldRepository";
import { FieldName } from "../jiraRepository";

export class JiraSummaryRepository extends JiraIssueFieldRepository<string> {
    public getFieldName(): FieldName {
        return "Summary";
    }

    public getFieldId(): string | undefined {
        return this.options.jira.fields?.summary;
    }

    public getOptionName(): keyof JiraFieldIds {
        return "summary";
    }
    protected getFieldExtractor(): FieldExtractor<string> {
        // Field property example:
        // summary: "Bug 12345"
        return STRING_EXTRACTOR;
    }
}
