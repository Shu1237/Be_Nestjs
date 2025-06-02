export interface IMovie {
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
}