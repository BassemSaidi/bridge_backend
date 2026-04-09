# BridgeTN Backend API

Professional logistics management system for independent transporters using Node.js, Express.js, and MySQL.

## 🚀 Features

- **User Authentication** with JWT tokens
- **Role-based Access Control** (ADMIN, TRANSPORTEUR)
- **Account Management** with JSON fields for routes, guides, and restrictions
- **Voyage Management** with status tracking
- **Colis (Package) Management** with payment tracking
- **JSON Data Handling** for complex fields
- **Security** with bcrypt, helmet, CORS, rate limiting
- **Error Handling** with comprehensive middleware
- **Database Connection Pool** for performance

## 📁 Project Structure

```
backend/
├── config/
│   └── database.js          # MySQL connection pool
├── controllers/
│   ├── accountController.js  # Account CRUD operations
│   ├── authController.js    # Authentication logic
│   ├── colisController.js   # Package management
│   └── voyageController.js  # Voyage management
├── middleware/
│   ├── auth.js            # JWT authentication & authorization
│   └── errorHandler.js    # Global error handling
├── models/
│   ├── Account.js         # Account data model
│   ├── Colis.js          # Package data model
│   ├── User.js           # User data model
│   └── Voyage.js         # Voyage data model
├── routes/
│   ├── accounts.js        # Account routes
│   ├── auth.js           # Authentication routes
│   ├── colis.js          # Package routes
│   └── voyages.js       # Voyage routes
├── utils/
│   └── jwt.js           # JWT utilities
├── database/
│   ├── schema.sql       # Database schema (no sample data)
│   └── createAdmin.js  # Admin user creation script
├── .env.example         # Environment variables template
├── package.json         # Dependencies and scripts
├── server.js           # Main application file
└── README.md          # This file
```

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Set up database**
   ```bash
   # Create database structure (no sample data)
   mysql -u root -p < database/schema.sql
   ```

5. **Create admin user**
   ```bash
   # Creates admin with email: admin@bridgetn.com, password: admin123
   npm run setup-admin
   ```

6. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 🗄️ Database Schema

### Users Table
- `id` - Primary key
- `mail` - Unique email (VARCHAR 191)
- `mdp` - Hashed password
- `role` - ENUM (ADMIN, TRANSPORTEUR)

### Account Table
- `id` - Primary key
- `user_id` - Foreign key to Users
- `nom`, `Tel1`, `Tel2`, `Bio`, `voiture` - Basic info
- `paysTrajet` - JSON array of countries
- `guide` - JSON array of services
- `interdits` - JSON array of restrictions

### Voyage Table
- `idV` - Primary key
- `account_id` - Foreign key to Account
- `PaysD`, `PaysF` - Departure/arrival countries
- `villePD`, `villePF` - JSON arrays of cities
- `DateD`, `DateF` - Departure/arrival dates
- `status` - ENUM (SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED)
- `codeT` - Unique tracking code

### Colis Table
- `idCo` - Primary key
- `voyage_id` - Foreign key to Voyage
- `nomS`, `TelS`, `adresseS`, `detailsS` - Sender info
- `nomR`, `TelR`, `adresseR`, `detailsR` - Receiver info
- `KgCo`, `prixTotale` - Weight and price
- `payementStatus` - ENUM (PAID, TO PAY)
- `photoCo` - JSON array of photo URLs

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Accounts
- `POST /api/accounts` - Create account (TRANSPORTEUR)
- `GET /api/accounts/me` - Get my account
- `GET /api/accounts/:id` - Get account by ID
- `PUT /api/accounts/:id` - Update account
- `PATCH /api/accounts/:id/routes` - Update routes
- `PATCH /api/accounts/:id/guide` - Update guide
- `PATCH /api/accounts/:id/restrictions` - Update restrictions
- `DELETE /api/accounts/:id` - Delete account

### Voyages
- `POST /api/voyages` - Create voyage
- `GET /api/voyages` - Get all voyages
- `GET /api/voyages/:id` - Get voyage by ID
- `PUT /api/voyages/:id` - Update voyage
- `PATCH /api/voyages/:id/status` - Update status
- `DELETE /api/voyages/:id` - Delete voyage
- `GET /api/voyages/stats` - Get statistics

### Colis (Packages)
- `POST /api/colis` - Create colis
- `GET /api/colis` - Get all colis
- `GET /api/colis/:id` - Get colis by ID
- `PUT /api/colis/:id` - Update colis
- `PATCH /api/colis/:id/payment` - Update payment status
- `PATCH /api/colis/:id/photos` - Update photos
- `DELETE /api/colis/:id` - Delete colis
- `GET /api/colis/stats` - Get statistics

## 🔐 Security Features

- **Password Hashing** with bcrypt
- **JWT Authentication** with expiration
- **Role-based Authorization** (ADMIN, TRANSPORTEUR)
- **Rate Limiting** (100 requests per 15 minutes)
- **CORS Configuration** for frontend integration
- **Helmet.js** for security headers
- **Input Validation** and sanitization

## 📊 JSON Field Examples

### Account Routes
```json
{
  "paysTrajet": ["Tunisia", "France", "Italy"],
  "guide": ["Proper packaging", "Insurance available"],
  "interdits": ["Dangerous goods", "Live animals"]
}
```

### Voyage Cities
```json
{
  "villePD": ["Tunis", "Sfax", "Sousse"],
  "villePF": ["Paris", "Lyon", "Marseille"]
}
```

### Colis Photos
```json
{
  "photoCo": ["photo1.jpg", "photo2.jpg", "photo3.jpg"]
}
```

## 🧪 Testing

### Admin User Setup
After running `npm run setup-admin`, you can test with:
- **Email**: admin@bridgetn.com
- **Password**: admin123

### Postman Collection
```json
{
  "login": {
    "method": "POST",
    "url": "http://localhost:5000/api/auth/login",
    "body": {
      "mail": "admin@bridgetn.com",
      "mdp": "admin123"
    }
  }
}
```

### Health Check
```bash
curl http://localhost:5000/health
```

## 🚀 Deployment

1. **Set production environment variables**
2. **Run setup-admin script** to create admin user
3. **Build and run with PM2 or similar**
4. **Configure reverse proxy (nginx)**
5. **Set up SSL certificate**
6. **Configure database backups**

## 📝 Development Notes

- Uses **async/await** throughout
- **Connection pooling** for database performance
- **Automatic JSON parsing** for complex fields
- **Comprehensive error handling**
- **RESTful API design**
- **Clean architecture** with separation of concerns
- **No sample data** in schema (clean setup)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make your changes
4. Add tests if applicable
5. Submit pull request

## 📄 License

This project is licensed under the MIT License.
