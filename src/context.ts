import { Uploader } from "./uploader";

export class UploadContext {
    public static PROJECT_KEY: string = null;
    public static ENV: Cypress.ObjectLike = null;
    public static UPLOADER: Uploader<any> = null;
    public static TEST_TYPE: string = "Manual";
}
