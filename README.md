# CreditChain AI Backend

## Overview

CreditChain AI is an advanced financial technology solution that leverages artificial intelligence for credit scoring and anomaly detection, while ensuring data integrity and transparency through blockchain technology on the Ethereum Sepolia Testnet.

## Features

- **AI-Powered Credit Scoring**: Advanced machine learning models for accurate credit assessment
- **Anomaly Detection**: Real-time transaction fraud detection and risk analysis
- **Blockchain Integration**: Immutable credit score storage on Ethereum Sepolia
- **IPFS Storage**: Decentralized storage for detailed credit reports
- **Dummy Data Generation**: Realistic financial profile and transaction generation
- **RESTful API**: Comprehensive API for all operations
- **Security**: JWT authentication, rate limiting, and data encryption

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Blockchain**: Ethereum Sepolia Testnet via Infura
- **Smart Contracts**: Solidity with Hardhat
- **AI/ML**: Python FastAPI service (deployed separately)
- **Storage**: IPFS for decentralized data storage
- **Authentication**: JWT tokens
- **Logging**: Winston logger

## Project Structure

\`\`\`
backend/
├── src/
│   ├── controllers/          # Request handlers
│   ├── models/              # MongoDB schemas
│   ├── routes/              # API route definitions
│   ├── services/            # Business logic services
│   ├── utils/               # Utility functions
│   ├── middleware/          # Express middleware
│   ├── config/              # Configuration files
│   └── app.js               # Main application file
├── contracts/               # Smart contracts
├── package.json
├── .env                     # Environment variables
└── README.md
\`\`\`

## Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account
- Infura account (for Ethereum access)
- IPFS account (Pinata or Infura IPFS)

### 1. Clone and Install Dependencies

\`\`\`bash
git clone <repository-url>
cd backend
npm install
\`\`\`

### 2. Environment Configuration

Create a `.env` file with the following variables:

\`\`\`env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DB_NAME=creditchain

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=30d

# AI/ML Service (Your Railway FastAPI)
ML_SERVICE_URL=https://your-ml-service.up.railway.app

# Blockchain
INFURA_PROJECT_ID=your-infura-project-id
INFURA_PROJECT_SECRET=your-infura-project-secret
ETHEREUM_NETWORK=sepolia
PRIVATE_KEY=your-private-key-without-0x
CONTRACT_ADDRESS_CREDIT=deployed-credit-contract-address
CONTRACT_ADDRESS_IDENTITY=deployed-identity-contract-address

# IPFS
IPFS_PROJECT_ID=your-ipfs-project-id
IPFS_PROJECT_SECRET=your-ipfs-project-secret

# Application
PORT=5000
NODE_ENV=development
CORS_ORIGIN=*

# Security
SALT_ROUNDS=12
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=900000
\`\`\`

### 3. Deploy Smart Contracts

\`\`\`bash
# Install Hardhat dependencies
npm install --save-dev hardhat @nomiclabs/hardhat-ethers ethers @openzeppelin/contracts

# Deploy contracts
node contracts/deploy.js
\`\`\`

Update your `.env` file with the deployed contract addresses.

### 4. Start the Application

\`\`\`bash
# Development mode
npm run dev

# Production mode
npm start
\`\`\`

## API Documentation

### Authentication Endpoints

#### POST /api/auth/signup
Register a new user with basic details.

**Request Body:**
\`\`\`json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "panNumber": "ABCDE1234F",
  "aadhaarNumber": "1234-5678-9012",
  "creditCardNumber": "1234-5678-9012-3456"
}
\`\`\`

#### POST /api/auth/login
Login with email and password.

**Request Body:**
\`\`\`json
{
  "email": "john@example.com",
  "password": "password123"
}
\`\`\`

### User Management Endpoints

#### POST /api/user/fetch-details
Generate financial profile and dummy transactions.

**Headers:** `Authorization: Bearer <token>`

#### GET /api/user/profile/:userId
Get user profile and financial information.

### Credit Score Endpoints

#### POST /api/credit-score/calculate/:userId
Calculate credit score using AI models.

**Headers:** `Authorization: Bearer <token>`

#### GET /api/credit-score/history/:userId
Get credit score history with pagination.

### Transaction Endpoints

#### GET /api/transactions/:userId
Get user transactions with filtering options.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `category`: Filter by category
- `type`: Filter by type (debit/credit)
- `anomaliesOnly`: Show only anomalous transactions

#### GET /api/transactions/anomalies/:userId
Get anomalous transactions with risk analysis.

### Blockchain Endpoints

#### POST /api/blockchain/verify
Verify blockchain transaction.

**Request Body:**
\`\`\`json
{
  "userId": "user-id",
  "transactionHash": "0x..."
}
\`\`\`

#### GET /api/blockchain/history/:walletAddress
Get blockchain credit score history.

## Deployment Guide

### Railway Deployment

1. **Create Railway Account**
   - Sign up at [railway.app](https://railway.app)
   - Connect your GitHub account

2. **Deploy from GitHub**
   \`\`\`bash
   # Push your code to GitHub
   git add .
   git commit -m "Initial commit"
   git push origin main
   \`\`\`

3. **Create New Project**
   - Click "New Project" in Railway dashboard
   - Select "Deploy from GitHub repo"
   - Choose your repository

4. **Configure Environment Variables**
   - Go to your project settings
   - Add all environment variables from your `.env` file
   - Ensure `PORT` is set to `5000`

5. **Deploy Smart Contracts**
   \`\`\`bash
   # From your local machine
   node contracts/deploy.js
   \`\`\`
   
   Update `CONTRACT_ADDRESS_CREDIT` and `CONTRACT_ADDRESS_IDENTITY` in Railway environment variables.

6. **Custom Domain (Optional)**
   - Go to Settings > Domains
   - Add your custom domain
   - Update DNS records as instructed

### Alternative Deployment Options

#### Heroku
\`\`\`bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create your-app-name

# Set environment variables
heroku config:set MONGODB_URI=your-mongodb-uri
heroku config:set JWT_SECRET=your-jwt-secret
# ... add all other environment variables

# Deploy
git push heroku main
\`\`\`

#### DigitalOcean App Platform
1. Create account at DigitalOcean
2. Go to App Platform
3. Create new app from GitHub
4. Configure environment variables
5. Deploy

#### AWS EC2
1. Launch EC2 instance
2. Install Node.js and MongoDB
3. Clone repository
4. Configure environment variables
5. Use PM2 for process management
6. Configure nginx as reverse proxy

## Database Schema

### User Schema
- Personal information (name, email, phone)
- Identity documents (PAN, Aadhaar, Credit Card)
- Verification status and wallet address

### Financial Profile Schema
- Personal info (age, income, employment)
- Existing loans and credit cards
- Bank account details
- Alternative scoring factors
- Behavioral patterns

### Transaction Schema
- Transaction details (amount, type, category)
- Merchant and location information
- Anomaly detection results
- Temporal patterns

### Credit Score Result Schema
- Credit score and confidence level
- Risk assessment and breakdown
- Recommendations and improvement tips
- Blockchain and IPFS hashes

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevents API abuse
- **Data Encryption**: PII data hashing
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Cross-origin request security
- **Helmet.js**: Security headers
- **MongoDB Injection Protection**: Mongoose validation

## Monitoring and Logging

- **Winston Logger**: Structured logging
- **Error Handling**: Comprehensive error management
- **Request Logging**: API request tracking
- **Performance Monitoring**: Response time tracking

## Testing

\`\`\`bash
# Run tests (when implemented)
npm test

# Run with coverage
npm run test:coverage
\`\`\`

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Email: support@creditchain.ai
- Documentation: [docs.creditchain.ai](https://docs.creditchain.ai)
- Issues: GitHub Issues page

## Roadmap

- [ ] Frontend React application
- [ ] Mobile app development
- [ ] Advanced ML models
- [ ] Multi-chain support
- [ ] Real-time notifications
- [ ] Advanced analytics dashboard
\`\`\`

This completes the full CreditChain AI backend implementation with:

1. ✅ **Complete Controllers** - All 5 controllers (auth, user, creditScore, transaction, blockchain)
2. ✅ **Complete Routes** - All API route definitions
3. ✅ **Smart Contracts** - Solidity contracts for blockchain integration
4. ✅ **Deployment Scripts** - Automated contract deployment
5. ✅ **Comprehensive README** - Complete setup and deployment guide

## Deployment Instructions Summary:

### For Railway (Recommended):
1. Push code to GitHub
2. Create Railway project from GitHub repo
3. Add all environment variables
4. Deploy smart contracts locally: `node contracts/deploy.js`
5. Update contract addresses in Railway environment
6. Your API will be live at `https://your-app.up.railway.app`

### Key Environment Variables to Set:
- `MONGODB_URI` - Your MongoDB Atlas connection string
- `ML_SERVICE_URL` - Your existing Railway FastAPI URL
- `INFURA_PROJECT_ID` & `INFURA_PROJECT_SECRET` - From Infura dashboard
- `PRIVATE_KEY` - Ethereum wallet private key (without 0x)
- `JWT_SECRET` - Random secure string
- All other variables from your existing `.env`

The backend is now complete and ready for deployment! 🚀
