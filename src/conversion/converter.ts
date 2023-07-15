import { InternalOptions } from "../types/plugin";

/**
 * A basic class for converting data from an input type to a target type.
 *
 * @template ConversionInputType - the conversion innput type
 * @template ConversionTargetType - the conversion target type
 */
export abstract class Converter<ConversionInputType, ConversionTargetType> {
    /**
     * The configured plugin options.
     */
    protected readonly options: InternalOptions;

    constructor(options: InternalOptions) {
        this.options = options;
    }

    /**
     * Convert an input object into a target object.
     *
     * @param results the run results
     * @returns the target object
     */
    public abstract convert(input: ConversionInputType): ConversionTargetType;
}
