import { ENV_XRAY_PROJECT_KEY } from "../constants";
import { UploadContext } from "../context";

export function validateConfiguration() {
    if (!UploadContext.ENV[ENV_XRAY_PROJECT_KEY]) {
        throw new MissingEnvironmentVariableError(ENV_XRAY_PROJECT_KEY);
    }
}

class XrayUploadConfigurationError extends Error {
    constructor(message: string) {
        super(
            `Jira Xray upload plugin was not configured correctly: ${message}`
        );
    }
}

class MissingEnvironmentVariableError extends XrayUploadConfigurationError {
    constructor(variable: string) {
        super(`environment variable '${variable}' was not set`);
    }
}
