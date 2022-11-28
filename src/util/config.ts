import { UploadContext } from "../context";

const ENV_PROJECT_KEY = "XRAY_PROJECT_KEY";

export function validateConfiguration() {
    if (!UploadContext.ENV[ENV_PROJECT_KEY]) {
        throw new MissingEnvironmentVariableError(ENV_PROJECT_KEY);
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
