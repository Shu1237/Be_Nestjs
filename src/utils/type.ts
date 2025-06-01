export type CreateAccountType = {
    address: string;
    date_of_birth: Date;
    email: string;
    full_name: string;
    gender: boolean;
    identity_card: string;
    image?: string;
    password: string;
    phone_number: string;
    username: string;
    role_id?: number;
};

export type LogoutType = {
    refresh_token: string;
}

export type LoginType = {
    username: string;
    password: string;
}
export type changePasswordType = {
    newPassword: string;
    token: string;
}
export type  RefreshTokenType = {
    refresh_token: string;
}
export type JWTUserType = {
    account_id: string;
    username: string;
    role_id: number; // 1: User, 2: Moderator, 3: Admin
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

