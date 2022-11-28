import { Uploader } from "./uploader";

export class UploadContext {
    public static ENV: Cypress.ObjectLike;
    public static UPLOADER: Uploader<any> = null;
    public static TEST_TYPE: string = "Manual";
}
