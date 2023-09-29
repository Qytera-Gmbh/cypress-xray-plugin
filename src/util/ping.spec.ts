import { AxiosHeaders, AxiosResponse, HttpStatusCode } from "axios";
import { expect } from "chai";
import { stubRequests } from "../../test/util";
import { UserServer } from "../types/jira/responses/user";
import { pingJiraServer } from "./ping";

describe("Jira server ping", () => {
    it("returns true on success", async () => {
        const { stubbedGet } = stubRequests();
        const response: AxiosResponse<UserServer> = {
            status: HttpStatusCode.Ok,
            data: {
                active: true,
                displayName: "Demo User",
            },
            headers: {},
            statusText: HttpStatusCode[HttpStatusCode.Ok],
            config: { headers: new AxiosHeaders() },
        };
        stubbedGet.onFirstCall().resolves(response);
        const pong = await pingJiraServer("https://example.org", {
            Authorization: "Bearer token",
        });
        expect(pong).to.be.true;
    });
});
