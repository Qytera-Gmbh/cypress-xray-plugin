import { ENV_XRAY_PROJECT_KEY } from "../../src/constants";
import { UploadContext } from "../../src/context";
import { env } from "./helpers";

beforeEach(() => {
    // Setup environment variables.
    UploadContext.ENV = process.env;
    UploadContext.PROJECT_KEY = env(ENV_XRAY_PROJECT_KEY);
});
