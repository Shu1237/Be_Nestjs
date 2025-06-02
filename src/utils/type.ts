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

export type GoogleUserType = {
    email: string;
    avatarUrl: string;
    password?: string; 
}

export type IMovie = {
  name: string;
  content: string;
  director: string;
  duration: number;
  from_date: Date;
  to_date: Date;
  production_company: string;
  thumbnail: string;
  banner: string;
  version?: string;
}