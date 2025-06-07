export type CreateAccountType = {
  address: string;
  date_of_birth: Date;
  email: string;
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
};

export type LoginType = {
  username: string;
  password: string;
};
export type changePasswordType = {
  newPassword: string;
  token: string;
};
export type RefreshTokenType = {
  refresh_token: string;
};
export type JWTUserType = {
  account_id: string;
  username: string;
  role_id: number;
};

export type GoogleUserType = {
  email: string;
  avatarUrl: string;
  password?: string;
};






export type IActor = {
  id: number;
  name: string;
};

export type IVersion = {
  id: number;
  name: string;
};

export type IGerne = {
  id: number;
  genre_name: string;
};

export type IMovie = {
  id: number;
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
  is_deleted: boolean;
  actors: IActor[]; // Chỉ chứa id và name
  gernes: IGerne[]; // Chỉ chứa id và genre_name
  versions: IVersion[]; // Chỉ chứa id và name
};

export type ISchedule = {
  id: number;
  show_date: Date;
  movie: IMovieBasic;
  cinema_room_id: number;
   // Chỉ chứa id và name
}

export type IMovieBasic = {
  id: number;
  name: string;
};