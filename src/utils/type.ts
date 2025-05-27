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
export type changePasswordType = {
    newPassword: string;
    token: string;
}

export type JWTUSerType = {
    ACCOUNT_ID: string;
    USERNAME: string;
    ROLE_ID: number; // 1: User, 2: Moderator, 3: Admin
}

export type LoginGoogleType = {
    googleToken: string;
    clientID: string;
     ADDRESS?: string;
  DATE_OF_BIRTH?: string;
  GENDER?: string;
  IDENTITY_CARD?: string;
  PHONE_NUMBER?: string;
}

export type GoogleIdTokenPayload = {
    sub: string; // Google user ID
    email: string;
    email_verified: boolean;
    name: string;
    picture: string;
    given_name: string;
    family_name: string;
    aud: string; // audience = clientID
    exp: number;
    iss: string;
}

