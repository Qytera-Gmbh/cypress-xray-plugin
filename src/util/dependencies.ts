import type {
    IPreprocessorConfiguration,
    resolvePreprocessorConfiguration,
} from "@badeball/cypress-cucumber-preprocessor";
import { LOG } from "./logging";

export type CucumberPreprocessorArgs = Parameters<typeof resolvePreprocessorConfiguration>;

export interface CucumberPreprocessorExports {
    resolvePreprocessorConfiguration: (
        cypressConfig: CucumberPreprocessorArgs[0],
        environment: CucumberPreprocessorArgs[1],
        implicitIntegrationFolder: CucumberPreprocessorArgs[2]
    ) => Promise<IPreprocessorConfiguration>;
}

/**
 * Imports and returns an optional dependency.
 *
 * @param packageName - the dependency's package name
 * @returns the dependency
 */
async function importOptionalDependency<T>(packageName: string): Promise<T> {
    const dependency: T = await EXPORTS._import(packageName);
    LOG.message("debug", `Successfully imported optional dependency: ${packageName}`);
    return dependency;
}

/**
 * Workaround until module mocking becomes a stable feature. The current approach allows replacing
 * the `_import` function with a mocked one.
 *
 * @see https://nodejs.org/docs/latest-v23.x/api/test.html#mockmodulespecifier-options
 */
const EXPORTS = {
    /**
     * Dynamically imports a package.
     *
     * *Note: This function is mainly used for stubbing purposes only, since `import` cannot be stubbed
     * as it's not a function. You should probably use safer alternatives like
     * {@link importOptionalDependency | `importOptionalDependency`}.*
     *
     * @param packageName - the name of the package to import
     * @returns the package
     */
    ["_import"]: async <T>(packageName: string) => (await import(packageName)) as T,
    importOptionalDependency,
};

export default EXPORTS;
