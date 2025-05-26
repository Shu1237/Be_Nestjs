export type AccountType = {
    ADDRESS: string;
    DATE_OF_BIRTH: Date;
    EMAIL: string;
    FULL_NAME: string;
    GENDER: number;
    IDENTITY_CARD: string;
    IMAGE?: string;
    PASSWORD: string;
    PHONE_NUMBER: string;
    USERNAME: string;


    ROLE_ID?: number
}


export type LoginType = {
    USERNAME: string;
    PASSWORD: string;
}