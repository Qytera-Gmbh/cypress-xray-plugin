// TODO: write functions for uploading stuff to Xray

import axios from "axios";
import { URL_XRAY_V2 } from "./constants";

abstract class Uploader {
    protected static token?: string;

    public async authenticateXray(clientId: string, clientSecret: string) {
        const response = await axios.post(
            URL_XRAY_V2,
            {
                client_id: clientId,
                client_secret: clientSecret,
            },
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        Uploader.token = response.data;
    }
}
