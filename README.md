<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# 🎬 Movie Theater Booking System

<p align="center">
  <strong>A comprehensive online movie ticket booking system built with NestJS</strong>
</p>

<p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://github.com/typescript" target="_blank"><img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white" alt="TypeScript" /></a>
<a href="https://nestjs.com/" target="_blank"><img src="https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white" alt="NestJS" /></a>
<a href="https://www.mysql.com/" target="_blank"><img src="https://img.shields.io/badge/MySQL-005C84?style=flat&logo=mysql&logoColor=white" alt="MySQL" /></a>
</p>

## 📋 Overview

The Movie Theater Booking System is a backend web application developed with **NestJS** and **TypeScript**, providing RESTful APIs for cinema management, online ticket booking, and diverse payment processing. The system supports advanced features such as real-time seat booking, automated scheduling, and multiple payment gateway integrations.

## ✨ Key Features

### 🎭 Cinema & Movie Management
- **Movie Management**: CRUD operations for movies with detailed information (actors, genres, versions)
- **Cinema Management**: Create and manage cinema rooms with seat layouts
- **Smart Scheduling**: Automatically generate schedules based on revenue and popularity
- **Movie Versions**: Support multiple versions (2D, 3D, IMAX, Dolby Atmos)

### 🎫 Ticket Booking System
- **Real-time Booking**: WebSocket for real-time seat status updates
- **Seat Management**: Hold seats for 10 minutes during booking process
- **Diverse Ticket Types**: Regular, VIP, Couple seats with different pricing
- **QR Code**: Automatically generate QR codes for paid tickets

### 💳 Multiple Payment Methods
- **MoMo**: Popular e-wallet in Vietnam
- **VNPay**: Vietnamese banking payment gateway
- **ZaloPay**: Zalo e-wallet
- **PayPal**: International payment
- **Stripe (Visa/Mastercard)**: Credit card payment
- **Cash**: Counter payment

### 👥 User Management
- **Registration/Login**: Authentication system with JWT
- **Google OAuth**: Quick login with Google account
- **Role Management**: Admin, Employee, Customer with different permissions
- **Points System**: Accumulate and use reward points

### 📊 Management & Reports
- **Overview Dashboard**: Revenue statistics, ticket sales
- **Order Management**: View order details, refunds
- **Email Notifications**: Send confirmation and refund emails
- **Promotion System**: Create and manage discount codes

### 🔧 Technical Features
- **Caching**: Redis for performance optimization
- **File Upload**: AWS S3 for image storage
- **Scheduled Tasks**: Cron jobs for cleanup and automation
- **WebSocket**: Real-time communication
- **API Documentation**: Swagger/OpenAPI

## 🏗️ System Architecture

### Technology Stack
- **Backend Framework**: NestJS 11.x
- **Language**: TypeScript 5.x
- **Database**: MySQL 2.x with TypeORM
- **Cache**: Redis (ioredis)
- **Authentication**: JWT + Passport
- **File Storage**: AWS S3
- **Email**: NodeMailer with Handlebars templates
- **WebSocket**: Socket.IO
- **Payment**: Multiple gateways integration
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest

### Directory Structure
```
src/
├── common/                 # Shared utilities & configurations
│   ├── config/            # Application configuration
│   ├── cron/              # Scheduled tasks & automation
│   ├── decorator/         # Custom decorators
│   ├── enums/             # Application enums
│   ├── exceptions/        # Custom exceptions
│   ├── gateways/          # WebSocket gateways
│   ├── guards/            # Authentication & authorization guards
│   ├── interceptors/      # Request/response interceptors
│   ├── pagination/        # Pagination utilities
│   ├── qrcode/            # QR code generation
│   ├── redis/             # Redis configuration
│   ├── s3/                # AWS S3 integration
│   └── utils/             # Helper functions
├── database/              # Database entities & models
│   └── entities/
│       ├── cinema/        # Cinema, Movie, Schedule entities
│       ├── order/         # Order, Ticket, Transaction entities
│       ├── user/          # User & authentication entities
│       └── item/          # Product & promotion entities
├── modules/               # Feature modules
│   ├── auth/              # Authentication & authorization
│   ├── actor/             # Actor management
│   ├── cinema-room/       # Cinema room management
│   ├── gerne/             # Movie genres
│   ├── movie/             # Movie management
│   ├── order/             # Order processing & payment
│   │   └── payment-method/ # Payment gateway integrations
│   ├── schedule/          # Movie scheduling
│   ├── seat/              # Seat management
│   ├── ticket/            # Ticket management
│   ├── member/            # User management
│   ├── promotion/         # Promotion & discount system
│   └── overview/          # Dashboard & statistics
└── template/              # Email templates
```

## 🚀 API Endpoints

### Authentication
```
POST   /auth/register              # Register account
POST   /auth/login                 # Login
POST   /auth/google                # Google OAuth login
POST   /auth/refresh-token         # Refresh JWT token
POST   /auth/logout                # Logout
```

### Movies & Cinema
```
GET    /movies                     # List movies
GET    /movies/:id                 # Movie details
POST   /movies                     # Create new movie (Admin)
PUT    /movies/:id                 # Update movie (Admin)
DELETE /movies/:id                 # Delete movie (Admin)

GET    /cinema-rooms               # List cinema rooms
POST   /cinema-rooms               # Create cinema room (Admin)
PUT    /cinema-rooms/:id           # Update cinema room (Admin)
```

### Scheduling
```
GET    /schedules                  # List schedules
GET    /schedules/:id              # Schedule details
POST   /schedules                  # Create schedule (Admin)
PUT    /schedules/:id              # Update schedule (Admin)
```

### Booking & Orders
```
GET    /seats/room/:roomId         # List seats by room
GET    /schedule-seats/:scheduleId # Seat status by schedule

POST   /order                      # Create order
GET    /order                      # User's order list
GET    /order/:id                  # Order details
PATCH  /order/:id/cancel           # Cancel order
```

### Payment Processing
```
POST   /order/momo                 # MoMo payment
POST   /order/vnpay                # VNPay payment
POST   /order/zalopay              # ZaloPay payment
POST   /order/paypal               # PayPal payment
POST   /order/visa                 # Stripe (Visa) payment

# Payment callbacks
GET    /order/momo/return          # MoMo callback
GET    /order/vnpay/return         # VNPay callback
GET    /order/zalopay/return       # ZaloPay callback
GET    /order/paypal/return        # PayPal callback
GET    /order/visa/return          # Stripe callback
```

### User Management
```
GET    /users/profile              # Profile information
PUT    /users/profile              # Update profile
GET    /users/booking-history      # Booking history
GET    /users/points               # Accumulated points
```

### Admin Dashboard
```
GET    /overview/dashboard         # Overview dashboard
GET    /overview/revenue           # Revenue report
GET    /overview/popular-movies    # Popular movies
GET    /overview/user-stats        # User statistics
```

## 🔧 Installation and Setup

### System Requirements
- Node.js >= 18.x
- MySQL >= 8.0
- Redis >= 6.0
- npm or yarn

### 1. Clone repository
```bash
git clone <repository-url>
cd Be_Nestjs
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create `.env` file with required environment variables:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_DATABASE=movie_theater

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Redis
REDIS_PUBLIC_URL=redis://localhost:6379

# AWS S3
S3_ACCESS_KEY=your_s3_access_key
S3_SECRET_KEY=your_s3_secret_key
S3_REGION=your_s3_region
S3_BUCKET_NAME=your_bucket_name

# Email
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASSWORD=your_app_password

# Payment Gateways
# MoMo
MOMO_ACCESS_KEY=your_momo_access_key
MOMO_SECRET_KEY=your_momo_secret_key
MOMO_PARTNER_CODE=your_partner_code

# VNPay
VNP_TMN_CODE=your_vnpay_tmn_code
VNP_HASH_SECRET=your_vnpay_hash_secret
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html

# ZaloPay
ZALO_APP_ID=your_zalopay_app_id
ZALO_KEY=your_zalopay_key

# PayPal
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# Stripe
VISA_PUBLIC_KEY=your_stripe_public_key
VISA_SECRET_KEY=your_stripe_secret_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 4. Run database migrations
```bash
# Create database
npm run db:create

# Run migrations
npm run migration:run
```

### 5. Run the application

#### Development mode
```bash
npm run dev
```

#### Production mode
```bash
npm run build
npm run start:prod
```

### 6. Access the application
- **API Server**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api
- **WebSocket**: ws://localhost:3001

## 🧪 Testing

### Run unit tests
```bash
npm run test
```

### Run tests with coverage
```bash
npm run test:cov
```

### Run end-to-end tests
```bash
npm run test:e2e
```

### Watch mode
```bash
npm run test:watch
```

## 🔄 Advanced Features

### WebSocket Real-time Features
- **Seat Booking**: Real-time seat status updates
- **Live Notifications**: Order and payment notifications
- **Admin Dashboard**: Real-time statistics updates

### Automated Scheduling System
The system automatically creates schedules based on:
- Revenue from the last 3 days for each movie
- Golden hours (6 PM - 9 PM) prioritize popular movies
- Optimize cinema room usage
- Runs daily at 2 AM

### Smart Payment Processing
- **Multi-gateway support**: 6 different payment gateways
- **Currency conversion**: Automatic VND ↔ USD conversion
- **Payment verification**: Signature and callback verification
- **Refund system**: Automatic refunds via API

### Security Features
- **JWT Authentication**: Access token + Refresh token
- **Role-based Access Control**: Admin, Employee, Customer
- **API Rate Limiting**: Request limit per IP
- **Input Validation**: Sanitize and validate all inputs
- **CORS Protection**: Secure CORS configuration

### Performance Optimization
- **Redis Caching**: Cache hot data and sessions
- **Database Indexing**: Optimize query performance
- **Pagination**: Pagination for large lists
- **Lazy Loading**: Load relations when needed
- **Connection Pooling**: Optimize database connections

## 📊 Database Schema

### Core Entities

#### User Management
```sql
users              # User information
├── id (PK)
├── email (unique)
├── password_hash
├── full_name
├── phone_number
├── role (admin/employee/customer)
├── points
└── is_verified

user_profiles      # Extended profile
├── user_id (FK)
├── avatar_url
├── date_of_birth
├── gender
└── address
```

#### Cinema Management
```sql
movies             # Movie information
├── id (PK)
├── name
├── description
├── duration_minutes
├── release_date
├── poster_url
├── trailer_url
├── age_rating
└── is_deleted

cinema_rooms       # Cinema rooms
├── id (PK)
├── cinema_room_name
└── is_deleted

seats              # Seats
├── id (PK)
├── seat_row
├── seat_column
├── cinema_room_id (FK)
├── seat_type_id (FK)
└── is_deleted

schedules          # Schedules
├── id (PK)
├── movie_id (FK)
├── cinema_room_id (FK)
├── version_id (FK)
├── start_movie_time
├── end_movie_time
└── is_deleted
```

#### Booking & Orders
```sql
orders             # Orders
├── id (PK)
├── user_id (FK)
├── total_prices
├── status
├── payment_method_id (FK)
├── promotion_id (FK)
├── created_at
└── updated_at

order_details      # Order details
├── id (PK)
├── order_id (FK)
├── schedule_id (FK)
├── ticket_id (FK)
├── total_each_ticket
└── created_at

tickets            # Tickets
├── id (PK)
├── schedule_id (FK)
├── seat_id (FK)
├── ticket_type_id (FK)
├── price
├── qr_code
├── status
└── created_at

transactions       # Payment transactions
├── id (PK)
├── order_id (FK)
├── payment_gateway
├── transaction_code
├── amount
├── status
├── payment_url
└── created_at
```

## 🔐 Authentication & Authorization

### JWT Token Structure
```json
{
  "access_token": {
    "user_id": "uuid",
    "email": "user@example.com",
    "role": "customer",
    "exp": "timestamp"
  },
  "refresh_token": {
    "user_id": "uuid",
    "token_id": "uuid",
    "exp": "timestamp"
  }
}
```

### Role-based Permissions
| Endpoint | Customer | Employee | Admin |
|----------|----------|----------|-------|
| Movies (Read) | ✅ | ✅ | ✅ |
| Movies (Write) | ❌ | ❌ | ✅ |
| Cinema Rooms (Read) | ✅ | ✅ | ✅ |
| Cinema Rooms (Write) | ❌ | ✅ | ✅ |
| Schedules (Read) | ✅ | ✅ | ✅ |
| Schedules (Write) | ❌ | ✅ | ✅ |
| Orders (Own) | ✅ | ✅ | ✅ |
| Orders (All) | ❌ | ✅ | ✅ |
| Dashboard | ❌ | ✅ | ✅ |
| User Management | ❌ | ❌ | ✅ |

## 🎯 Business Logic

### Seat Booking Flow
1. **User selects seats** → Check availability
2. **Hold seats for 10 minutes** → Update status to 'HELD'
3. **User proceeds to payment** → Create order with PENDING status
4. **Payment processing** → Redirect to payment gateway
5. **Payment callback** → Verify signature and update order
6. **Success**: Mark seats as 'BOOKED', generate QR code, send email
7. **Failure**: Release seats, mark order as 'FAILED'

### Auto-scheduling Algorithm
```typescript
// Cron job runs daily at 2 AM
@Cron('0 2 * * *')
async handleAutoScheduleMovies() {
  // 1. Calculate revenue from last 3 days
  const movieRevenue = await this.getMovieRevenue(3);
  
  // 2. Allocate slots based on revenue percentage
  const totalSlots = 20;
  const movieSlotPlan = this.calculateSlotDistribution(movieRevenue, totalSlots);
  
  // 3. Prioritize top movies during golden hours (6 PM - 9 PM)
  // 4. Avoid schedule conflicts in the same room
  // 5. Create schedules for tomorrow
}
```

### Payment Gateway Integration
Each payment gateway implements AbstractPaymentService:
```typescript
abstract class AbstractPaymentService {
  abstract createOrder(orderData: OrderBillType): Promise<PaymentResponse>;
  abstract handleReturn(query: any): Promise<string>;
  abstract queryOrderStatus(orderId: string): Promise<PaymentStatus>;
  
  // Shared business logic
  protected async handleReturnSuccess(transaction: Transaction): Promise<string>;
  protected async handleReturnFailed(transaction: Transaction): Promise<string>;
}
```

## 📈 Monitoring & Performance

### Metrics & Logging
- **Application logs**: NestJS Logger với different levels
- **Performance monitoring**: Request duration tracking
- **Error tracking**: Custom exception filters
- **Database queries**: TypeORM query logging
- **Cache hit rate**: Redis performance metrics

### Health Checks
```
GET /health/database    # Check database connection
GET /health/redis       # Check Redis connection
GET /health/s3          # Check AWS S3 connection
GET /health/payment     # Check payment gateways
```

## 🚀 Deployment

### Docker Configuration
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "run", "start:prod"]
```

### Environment Setup
- **Development**: Local MySQL + Redis
- **Staging**: Docker Compose with separate services
- **Production**: Kubernetes cluster with LoadBalancer

## 🤝 Contributing

### Development Workflow
1. Fork repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Create Pull Request

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration with custom rules
- **Prettier**: Code formatting
- **Commit messages**: Conventional Commits format
- **Testing**: Minimum 80% coverage required

### Pre-commit Hooks
```bash
npm run lint          # ESLint checking
npm run format        # Prettier formatting
npm run test          # Run unit tests
npm run build         # Build verification
```

## 📝 API Documentation

After running the application, access Swagger documentation at:
**http://localhost:3001/api**

### Sample API Requests

#### 1. Register account
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "full_name": "Nguyen Van A",
    "phone_number": "0123456789"
  }'
```

#### 2. Login
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

#### 3. View movie list
```bash
curl -X GET "http://localhost:3001/movies?page=1&take=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 4. Book tickets
```bash
curl -X POST http://localhost:3001/order \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "schedule_id": 1,
    "seats": ["R1_A1", "R1_A2"],
    "payment_method_id": 2,
    "promotion_id": null
  }'
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Error
```bash
Error: ER_ACCESS_DENIED_ERROR: Access denied for user
```
**Solution**: Check username, password and MySQL access permissions

#### 2. Redis Connection Failed
```bash
Error: connect ECONNREFUSED 127.0.0.1:6379
```
**Solution**: Ensure Redis server is running
```bash
redis-server
# or
docker run -d -p 6379:6379 redis:alpine
```

#### 3. JWT Token Invalid
```bash
Error: JsonWebTokenError: invalid token
```
**Solution**: Check JWT_SECRET in .env file

#### 4. Payment Gateway Errors
```bash
Error: Invalid signature
```
**Solution**: Re-verify API keys and secret keys for payment gateways

### Debug Mode
```bash
# Run with debug logs
DEBUG=* npm run dev

# Or only NestJS logs
DEBUG=nest:* npm run dev
```

## 📚 Resources & References

### Documentation
- [NestJS Official Docs](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [JWT Authentication Guide](https://jwt.io/introduction)
- [Socket.IO Documentation](https://socket.io/docs/v4)

### Payment Gateway APIs
- [MoMo API Documentation](https://developers.momo.vn)
- [VNPay API Documentation](https://sandbox.vnpayment.vn/apis)
- [ZaloPay API Documentation](https://docs.zalopay.vn)
- [PayPal API Documentation](https://developer.paypal.com/docs/api)
- [Stripe API Documentation](https://stripe.com/docs/api)

### Learning Resources
- [NestJS Course](https://courses.nestjs.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## 📄 License

<p align="center">
  <strong>🎬 Made with ❤️ for movie lovers</strong>
</p>
