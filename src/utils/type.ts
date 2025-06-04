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
export type RefreshTokenType = {
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




export type SeatInfo = {
    id: string;
    seat_row: string;
    seat_column: string;
    audience_type: 'adult' | 'student' | 'child';
}

export type OrderBillType = {
    payment_method: string;
    booking_date: Date;
    total_prices: string;
    promotion_id: number;
    schedule_id: number;
    seats: SeatInfo[];
}



export type CreatePromotionType = {
    title: string;
    detail?: string;
    discount_level: string;
    start_time?: string;  
    end_time?: string;
    exchange?: string;
    code: string;
    is_active?: boolean;
};

export type UpdatePromotionType = {
  title?: string;
  detail?: string;
  discount?: string;
  start_time?: string;
  end_time?: string;
  exchange?: string;
  code?: string;
  is_active?: boolean;
};


export type ChangePromotionType = {
  id: number;
  exchange: number;
};
