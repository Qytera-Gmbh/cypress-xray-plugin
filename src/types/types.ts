export interface APICredentials {}

export interface APIv2Credentials extends APICredentials {
    clientId: string;
    clientSecret: string;
}
