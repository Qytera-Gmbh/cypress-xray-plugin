import { InternalOptions } from "../types/plugin";

/**
 * @template ConversionTargetType - the conversion target type
 */
export abstract class Converter<ConversionTargetType> {
    /**
     * The configured plugin options.
     */
    protected readonly options: InternalOptions;

    constructor(options: InternalOptions) {
        this.options = options;
    }

    /**
     * Convert Cypress run results into a target object, ready to be sent to Xray's import execution
     * endpoints.
     *
     * @param results the run results
     * @returns the target object
     */
    public abstract convert(results: CypressCommandLine.CypressRunResult): ConversionTargetType;
}
