import axios from "axios";
import { XraySettings } from "./types/types";

export abstract class Uploader {
    private token: string = null;
    private readonly clientId: string;
    private readonly clientSecret: string;
    private readonly projectKey: string;
    private readonly url: string;

    constructor(
        clientId: string,
        clientSecret: string,
        projectKey: string,
        url: string
    ) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.projectKey = projectKey;
        this.url = url;
    }

    private async authenticateXray(): Promise<void> {
        const response = await axios.post(
            `${this.baseURL()}/authenticate`,
            {
                client_id: this.clientId,
                client_secret: this.clientSecret,
            },
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        this.token = response.data;
    }

    protected async getToken(): Promise<string> {
        if (!this.token) {
            try {
                await this.authenticateXray();
            } catch (error: any) {
                console.log("Failed to authenticato to Jira Xray:", error);
            }
        }
        return this.token;
    }

    protected getProjectKey(): string {
        return this.projectKey;
    }

    protected async getXraySettings(): Promise<XraySettings> {
        return {
            url: this.baseURL(),
            token: await this.getToken(),
        };
    }

    public async uploadResults(
        results:
            | CypressCommandLine.CypressRunResult
            | CypressCommandLine.CypressFailedRunResult
    ): Promise<void> {
        if (results.status === "failed") {
            console.error(
                `Failed to run ${results.failures} tests:`,
                results.message
            );
        }
        this.upload(results as CypressCommandLine.CypressRunResult);
    }

    protected abstract baseURL(): string;

    protected abstract upload(
        results: CypressCommandLine.CypressRunResult
    ): Promise<void>;
}
