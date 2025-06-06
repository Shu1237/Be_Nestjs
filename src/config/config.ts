export default () => ({
  jwt: {
    secret: process.env.JWT_SECRET_KEY || 'be_movie',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },


  refreshToken: {
    secret: process.env.REFRESH_TOKEN_SECRET || 'be_movie_refresh',
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '5d',
  },
  database: {
    type: process.env.DB_TYPE || 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'be_movietheater',
  },
});
