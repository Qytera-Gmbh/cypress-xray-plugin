import { isAxiosError } from "axios";
import { writeFileSync } from "fs";
import {
    APICredentials,
    APICredentialsOptions,
} from "../authentication/credentials";
import { logError } from "../logging/logging";

/**
 * A basic client interface which stores credentials data used for
 * communicating with the server.
 */
export abstract class Client<T extends APICredentials<APICredentialsOptions>> {
    protected readonly credentials: T;

    /**
     * Construct a new client using the provided credentials.
     *
     * @param credentials the credentials to use during authentication
     */
    constructor(credentials: T) {
        this.credentials = credentials;
    }

    /**
     * Return the client's credentials;
     *
     * @returns the credentials
     */
    public getCredentials(): T {
        return this.credentials;
    }

    /**
     * Writes an error to a file (e.g. HTTP response errors).
     *
     * @param error the error
     * @param filename the filename to use for the file
     */
    protected writeErrorFile(error: unknown, filename: string): void {
        let errorFileName: string;
        let errorData: string;
        if (isAxiosError(error)) {
            errorFileName = `${filename}.json`;
            errorData = JSON.stringify({
                error: error.toJSON(),
                response: error.response?.data,
            });
        } else {
            errorFileName = `${filename}.log`;
            errorData = JSON.stringify(error);
        }
        writeFileSync(errorFileName, errorData);
        logError(`Complete error logs have been written to "${errorFileName}"`);
    }
}
