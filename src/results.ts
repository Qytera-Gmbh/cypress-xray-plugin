import axios from "axios";
import FormData from "form-data";
import { createReadStream } from "fs";

export abstract class TestExecutionResult {
    public abstract upload(
        baseURL: string,
        projectKey: string,
        authToken: string
    ): Promise<any>;
}

export class JUnitTestExecutionResult extends TestExecutionResult {
    private readonly resultsFile: string;

    constructor(resultsFile: string) {
        super();
        this.resultsFile = resultsFile;
    }

    public upload(
        baseURL: string,
        projectKey: string,
        authToken: string
    ): Promise<any> {
        const fileStream = createReadStream(this.resultsFile);
        const form = new FormData();
        form.append("results", fileStream);
        return axios.post(`${baseURL}/junit?projectKey=${projectKey}`, form, {
            headers: {
                ...form.getHeaders(),
                Authorization: `Bearer ${authToken}`,
            },
        });
    }
}
