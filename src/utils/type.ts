import { User } from "src/typeorm/entities/user/user";

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
    role_id: number; 
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


export type OrderType ={
      booking_date: Date;
  add_score: number;
  use_score: number;
  total_prices: number;
  status: string;
  user: any;
  promotion?: any;
}
export type PromotionType ={
    title: string;
    detail?: string;
    discount_level: string;
    start_time?: Date;
    end_time?: Date;
    exchange?: string;
}
export type SeatData = {
  id: string;
  seat_row: string;
  seat_column: string;
  audience_type: string;
}

export type OrderBill = {
  payment_method: string;
  status: string;
  booking_date: Date;
  add_score: number;
  use_score: number;
  total_prices: string;
  user: User;
  promotion: number;
  schedule_id: number;
  seats: SeatData[];
}
