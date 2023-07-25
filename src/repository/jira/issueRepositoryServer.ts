import { JiraClientServer } from "../../client/jira/jiraClientServer";
import { XrayClientServer } from "../../client/xray/xrayClientServer";
import { IssueRepository } from "./issueRepository";

export class IssueRepositoryServer extends IssueRepository<XrayClientServer, JiraClientServer> {}
