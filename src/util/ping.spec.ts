import { AxiosHeaders, AxiosResponse, HttpStatusCode } from "axios";
import { expect } from "chai";
import { stubRequests } from "../../test/util";
import { PATCredentials } from "../authentication/credentials";
import { UserCloud, UserServer } from "../types/jira/responses/user";
import { pingJiraInstance } from "./ping";

describe("Jira instance ping", () => {
    it("returns true on success", async () => {
        const { stubbedGet } = stubRequests();
        const response: AxiosResponse<UserServer | UserCloud> = {
            status: HttpStatusCode.Ok,
            data: {
                active: true,
                displayName: "Demo User",
            },
            headers: {},
            statusText: HttpStatusCode[HttpStatusCode.Ok],
            config: { headers: new AxiosHeaders() },
        };
        stubbedGet
            .callsFake((...args: unknown[]) => {
                throw new Error(`Cannot call GET stub with arguments: ${args}`);
            })
            .withArgs("https://example.org/rest/api/latest/myself", {
                headers: { Authorization: "Bearer token" },
            })
            .resolves(response);
        const pong = await pingJiraInstance("https://example.org", new PATCredentials("token"));
        expect(pong).to.be.true;
    });
});
