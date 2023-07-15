import { InternalOptions } from "../types/plugin";

/**
 * A basic class for converting data from an input type to a target type.
 *
 * @template ConversionInputType the conversion innput type
 * @template ConversionTargetType the conversion target type
 * @template ConversionParametersType the conversion parameters type
 */
export abstract class Converter<
    ConversionInputType,
    ConversionTargetType,
    ConversionParametersType = void
> {
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
     * @param input the input object
     * @param parameters additional conversion parameters
     * @returns the target object
     */
    public abstract convert(
        input: ConversionInputType,
        parameters?: ConversionParametersType
    ): ConversionTargetType;
}
