import decompress from "decompress";

const DEFAULT_UNZIPPED_SUFFIX = "_out";

/**
 * Unzips a file.
 * @param zipFile - the path to a zip file
 * @param outputDirectory - an optional output directory to extract files to
 * @returns the path to the directory containing the zip file's content
 */
export async function unzip(zipFile: string, outputDirectory?: string): Promise<string> {
    if (!outputDirectory) {
        if (zipFile.includes(".")) {
            outputDirectory = zipFile.substring(0, zipFile.lastIndexOf("."));
        } else {
            outputDirectory = zipFile.concat(DEFAULT_UNZIPPED_SUFFIX);
        }
    }
    await decompress(zipFile, outputDirectory).then();
    return outputDirectory;
}
