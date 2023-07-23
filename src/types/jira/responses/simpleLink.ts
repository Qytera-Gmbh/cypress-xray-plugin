export type SimpleLink = {
    id?: string;
    styleClass?: string;
    iconClass?: string;
    label?: string;
    title?: string;
    href?: string;
    weight?: number;
    params?: {
        [k: string]: string;
    };
};
