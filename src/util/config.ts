import {
    ENV_JIRA_EXECUTION_ISSUE_KEY,
    ENV_JIRA_PROJECT_KEY,
    ENV_OPENSSL_ROOT_CA_PATH,
    ENV_OPENSSL_SECURE_OPTIONS,
    ENV_PLUGIN_NORMALIZE_SCREENSHOT_NAMES,
    ENV_PLUGIN_OVERWRITE_ISSUE_SUMMARY,
    ENV_XRAY_API_TOKEN,
    ENV_XRAY_API_URL,
    ENV_XRAY_CLIENT_ID,
    ENV_XRAY_CLIENT_SECRET,
    ENV_XRAY_PASSWORD,
    ENV_XRAY_STATUS_FAILED,
    ENV_XRAY_STATUS_PASSED,
    ENV_XRAY_USERNAME,
} from "../constants";
import { initContext, PLUGIN_CONTEXT } from "../context";
import {
    BasicAuthCredentials,
    JWTCredentials,
    PATCredentials,
} from "../credentials";
import { Uploader } from "../uploader";
import { CloudAPIUploader } from "../uploader/cloudAPI";
import { ServerAPIUploader } from "../uploader/serverAPI";
import { parseBoolean } from "./parsing";

export function validateConfiguration(env: Cypress.ObjectLike): void {
    if (!env[ENV_JIRA_PROJECT_KEY]) {
        throw new MissingEnvironmentVariableError(ENV_JIRA_PROJECT_KEY);
    }
    initContext({
        uploader: chooseUploader(env),
        projectKey: env[ENV_JIRA_PROJECT_KEY],
    });
    // Jira.
    if (env[ENV_JIRA_EXECUTION_ISSUE_KEY]) {
        PLUGIN_CONTEXT.jira.testExecutionKey =
            env[ENV_JIRA_EXECUTION_ISSUE_KEY];
    }
    // Xray.
    if (env[ENV_XRAY_STATUS_PASSED]) {
        PLUGIN_CONTEXT.xray.statusPassed = env[ENV_XRAY_STATUS_PASSED];
    }
    if (env[ENV_XRAY_STATUS_FAILED]) {
        PLUGIN_CONTEXT.xray.statusFailed = env[ENV_XRAY_STATUS_FAILED];
    }
    // Plugin.
    if (env[ENV_PLUGIN_OVERWRITE_ISSUE_SUMMARY]) {
        PLUGIN_CONTEXT.config.overwriteIssueSummary = parseBoolean(
            env[ENV_PLUGIN_OVERWRITE_ISSUE_SUMMARY]
        );
    }
    if (env[ENV_PLUGIN_NORMALIZE_SCREENSHOT_NAMES]) {
        PLUGIN_CONTEXT.config.normalizeScreenshotNames = parseBoolean(
            env[ENV_PLUGIN_NORMALIZE_SCREENSHOT_NAMES]
        );
    }
    // OpenSSL.
    if (env[ENV_OPENSSL_ROOT_CA_PATH]) {
        PLUGIN_CONTEXT.openSSL.rootCA = env[ENV_OPENSSL_ROOT_CA_PATH];
    }
    if (env[ENV_OPENSSL_SECURE_OPTIONS]) {
        PLUGIN_CONTEXT.openSSL.secureOptions = env[ENV_OPENSSL_SECURE_OPTIONS];
    }
}

function chooseUploader(env: Cypress.ObjectLike): Uploader<any> {
    if (env[ENV_XRAY_CLIENT_ID] && env[ENV_XRAY_CLIENT_SECRET]) {
        return new CloudAPIUploader(
            new JWTCredentials(
                env[ENV_XRAY_CLIENT_ID],
                env[ENV_XRAY_CLIENT_SECRET]
            )
        );
    } else if (env[ENV_XRAY_API_TOKEN] && env[ENV_XRAY_API_URL]) {
        return new ServerAPIUploader(
            env[ENV_XRAY_API_URL],
            new PATCredentials(env[ENV_XRAY_API_TOKEN])
        );
    } else if (
        env[ENV_XRAY_USERNAME] &&
        env[ENV_XRAY_PASSWORD] &&
        env[ENV_XRAY_API_URL]
    ) {
        return new ServerAPIUploader(
            env[ENV_XRAY_API_URL],
            new BasicAuthCredentials(
                env[ENV_XRAY_USERNAME],
                env[ENV_XRAY_PASSWORD]
            )
        );
    } else {
        throw new Error(
            "Failed to configure Jira Xray uploader: no viable Xray configuration was found or the configuration you provided is not supported.\n" +
                "You can find all configurations that are currently supported at https://github.com/Qytera-Gmbh/cypress-xray-plugin#authentication"
        );
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
