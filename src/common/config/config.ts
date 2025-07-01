export default () => ({
  jwt: {
    secret: process.env.JWT_SECRET_KEY,
    expiresIn: process.env.JWT_EXPIRES_IN,
    qrSecret: process.env.JWT_QR_CODE_SECRET,
    refreshToken: {
      secret: process.env.REFRESH_TOKEN_SECRET,
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
    },
    tmpToken: {
      secret: process.env.TMP_TOKEN_SECRET,
      expiresIn: process.env.TMP_EXPIRES_IN,
    },
    otpSecret: process.env.OTP_SECRET,
  },

  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_DATABASE,
    url: process.env.DATABASE_URL,
  },

  gmail: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT || '587', 10),
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL,
  },
  redirectUrls: {
    successUrl: process.env.FRONTEND_SUCCESS_URL,
    failureUrl: process.env.FRONTEND_FAILURE_URL,
  },

  momo: {
    accessKey: process.env.MOMO_ACCESS_KEY,
    secretKey: process.env.MOMO_SECRET_KEY,
    ipnUrl: process.env.MOMO_IPN_URL,
    redirectUrl: process.env.MOMO_REDIRECT_URL,
    partnerCode: process.env.MOMO_PARTNER_CODE,
  },

  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET,
    baseUrl: process.env.PAYPAL_BASE_URL,
    authUrl: process.env.PAYPAL_BASE_URL_AUTH,
    successUrl: process.env.PAYPAL_SUCCESS_URL,
    cancelUrl: process.env.PAYPAL_CANCEL_URL,
  },

  visa: {
    publicKey: process.env.VISA_PUBLIC_KEY,
    secretKey: process.env.VISA_SECRET_KEY,
    successUrl: process.env.VISA_SUCCESS_URL,
    cancelUrl: process.env.VISA_CANCEL_URL,
  },

  vnpay: {
    tmnCode: process.env.VNP_TMN_CODE,
    hashSecret: process.env.VNP_HASH_SECRET,
    url: process.env.VNP_URL,
    returnUrl: process.env.VNP_RETURN_URL,
  },

  zalopay: {
    appId: process.env.ZALO_APP_ID,
    key1: process.env.ZALO_KEY,
    endpoint: process.env.ZALOPAY_ENDPOINT,
    returnUrl: process.env.ZALO_RETURN_URL,
  },

  redis: {
    url: process.env.REDIS_PUBLIC_URL,
  },

  aws: {
    accessKey: process.env.S3_ACCESS_KEY,
    secretKey: process.env.S3_SECRET_KEY,
    region: process.env.S3_REGION,
    bucketName: process.env.S3_BUCKET_NAME,
  },
});
