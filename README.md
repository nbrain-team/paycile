# Paycile - Insurance Premium Payment Management Platform

Paycile is a modern, AI-powered SaaS platform designed to streamline insurance premium payment management and reconciliation for brokers, agents, and policyholders.

## 📚 Documentation

- **[Architecture Overview](./ARCHITECTURE.md)** - Comprehensive system architecture and technical documentation
- **[Technology Stack](./TECHNOLOGY_STACK.md)** - Detailed breakdown of technologies and decision matrix
- **[System Flows](./SYSTEM_FLOWS.md)** - Visual flow diagrams for core processes
- **[Enhancement Ideas](./ENHANCEMENT_IDEAS.md)** - Future features and improvements roadmap

## 🚀 Quick Start

## 🚀 Features

- **Policy & Billing Engine**: Import policies, generate invoices, handle pro-rated changes
- **Payment Management**: Accept multiple payment methods with mock processors
- **AI-Powered Reconciliation**: Intelligent payment matching with OpenAI integration
- **Role-Based Portals**: Separate interfaces for agents and clients
- **Real-time Analytics**: Comprehensive dashboards and reporting
- **Modern UI/UX**: Clean, responsive design with Tailwind CSS

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL
- **Authentication**: JWT-based auth
- **AI Integration**: OpenAI API
- **State Management**: Zustand
- **API Client**: Axios with React Query

## 📋 Prerequisites

- Node.js 18+ and npm 8+
- PostgreSQL 15+
- OpenAI API key (for AI features)

## 🚀 Local Development

### 1. Clone the repository
```bash
git clone https://github.com/nbrain-team/paycile.git
cd paycile
```

### 2. Set up environment variables

Create `.env` file in the backend directory:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/paycile
PORT=3001
JWT_SECRET=your-secure-jwt-secret
OPENAI_API_KEY=your-openai-api-key
```

### 3. Install dependencies
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 4. Set up the database
```bash
# Create database
createdb paycile

# Run migrations
psql -d paycile -f database/schema.sql

# Seed with mock data
psql -d paycile -f database/seed.sql
```

### 5. Start development servers
```bash
# From root directory
npm run dev
```

This will start:
- Backend API at http://localhost:3001
- Frontend at http://localhost:3000

## 🐳 Docker Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📦 Deployment on Render

### Backend Deployment

1. **Create a new Web Service on Render**
   - Connect your GitHub repository
   - Choose the `backend` directory as root
   - Environment: Node
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

2. **Add Environment Variables**:
   ```
   NODE_ENV=production
   DATABASE_URL=<your-render-postgres-url>
   JWT_SECRET=<generate-secure-secret>
   OPENAI_API_KEY=<your-openai-key>
   FRONTEND_URL=<your-frontend-url>
   ```

3. **Create a PostgreSQL database on Render**
   - Note the internal connection string
   - Run the schema.sql file to initialize tables

### Frontend Deployment

1. **Create a new Static Site on Render**
   - Connect your GitHub repository
   - Choose the `frontend` directory as root
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`

2. **Add Environment Variables**:
   ```
   VITE_API_URL=<your-backend-render-url>
   ```

3. **Add Redirect Rules** (in Render dashboard):
   - Source: `/*`
   - Destination: `/index.html`
   - Type: Rewrite

### Database Setup on Render

1. Create a PostgreSQL instance
2. Connect to the database using the connection string
3. Run the initialization script:
   ```bash
   psql <connection-string> -f database/schema.sql
   psql <connection-string> -f database/seed.sql
   ```

## 🔐 Default Login Credentials

After seeding the database, you can use these credentials:

**Admin Account:**
- Email: admin@paycile.com
- Password: admin123

**Agent Account:**
- Email: agent@paycile.com
- Password: agent123

**Client Account:**
- Email: client@paycile.com
- Password: client123

## 📱 Features Overview

### Agent Portal
- View all clients and policies
- Generate and manage invoices
- Process payments and refunds
- AI-powered reconciliation dashboard
- Export reports

### Client Portal
- View policies and invoices
- Make payments
- Set up autopay
- Download documents
- Contact support

### AI Reconciliation
- Automatic payment matching
- Confidence scoring
- Anomaly detection
- Manual override options

## 🧪 Mock Services

The platform includes mock implementations for:
- Payment processing (simulates Stripe)
- Bank connections (simulates Plaid)
- Email notifications

These allow full testing without external dependencies.

## 🔧 Configuration

### Payment Methods
Configure accepted payment methods in `backend/src/config/payment.config.ts`

### AI Settings
Adjust AI reconciliation parameters in `backend/src/services/ai/reconciliation.service.ts`

### Email Templates
Customize email templates in `backend/src/templates/`

## 📊 API Documentation

The API follows RESTful conventions:

- `GET /api/policies` - List policies
- `POST /api/invoices` - Create invoice
- `GET /api/payments` - List payments
- `POST /api/reconciliations/match` - AI matching

Full API documentation available at `/api/docs` when running locally.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support, email support@paycile.com or join our Slack channel. 