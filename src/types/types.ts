export interface APICredentials {}

export interface CloudAPICredentials extends APICredentials {
    clientId: string;
    clientSecret: string;
}
