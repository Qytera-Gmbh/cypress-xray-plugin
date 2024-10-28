import { encode } from "../util/base64";
import { normalizedFilename } from "../util/files";
import { enqueueTask } from "./tasks";

Cypress.Commands.overwrite(
    "request",
    (
        originalFn: Cypress.CommandOriginalFn<"request">,
        request: Partial<Cypress.RequestOptions>
    ) => {
        const method = normalizedFilename(
            typeof request === "string" ? "GET" : request.method ?? "UNKNOWN METHOD"
        );
        const url = normalizedFilename(
            typeof request === "string" ? request : request.url ?? "UNKNOWN URL"
        );
        const timestamp = normalizedFilename(new Date().toLocaleTimeString());
        const basename = `${method} ${url} ${timestamp}`;
        enqueueTask("cypress-xray-plugin:task:add-evidence", {
            contentType: "application/json",
            data: encode(JSON.stringify(request, null, 2)),
            filename: `${basename} request.json`,
        });
        return originalFn(request).then((response) => {
            enqueueTask("cypress-xray-plugin:task:add-evidence", {
                contentType: "application/json",
                data: encode(JSON.stringify(response, null, 2)),
                filename: `${basename} response.json`,
            });
            return response;
        });
    }
);
