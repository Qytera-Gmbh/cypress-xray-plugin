import { IPreprocessorConfiguration } from "@badeball/cypress-cucumber-preprocessor";
import { logDebug } from "./logging/logging";
import { dedent } from "./util/dedent";

export interface CucumberPreprocessorExports {
    resolvePreprocessorConfiguration: (
        cypressConfig: Cypress.PluginConfigOptions,
        environment: Record<string, unknown>,
        implicitIntegrationFolder: string
    ) => Promise<IPreprocessorConfiguration>;
}

export async function importOptionalDependency<T>(packageName: string): Promise<T> {
    try {
        const dependency: T = await importPackage(packageName);
        logDebug(`Successfully imported optional dependency: ${packageName}`);
        return dependency;
    } catch (error: unknown) {
        throw new Error(
            dedent(`
                Plugin dependency misconfigured: ${packageName}

                Reason: ${error}

                The plugin depends on the package and should automatically download it during installation, but might have failed to do so because of conflicting Node versions

                Make sure to install the package manually using: npm install ${packageName} --save-dev
            `)
        );
    }
}

/**
 * Dynamically imports a package.
 *
 * Note: This function is mainly used for stubbing purposes only, since `import` cannot be stubbed
 * as it's not a function. You should probably use safer alternatives like
 * {@link importOptionalDependency `importOptionalDependency`}.
 *
 * @param packageName the name of the package to import
 * @returns the package
 */
export async function importPackage<T>(packageName: string): Promise<T> {
    return await import(packageName);
}
