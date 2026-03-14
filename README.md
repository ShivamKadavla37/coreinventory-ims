# CoreInventory 📦

> A modular Inventory Management System MVP built for hackathons. Digitize inventory operations and replace Excel/manual tracking.

## Tech Stack

- **Frontend:** React + Tailwind CSS + Chart.js
- **Backend:** Node.js + Express
- **Database:** PostgreSQL
- **Auth:** JWT-based authentication

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

## Quick Start

### 1. Setup PostgreSQL Database

```sql
CREATE DATABASE coreinventory;
```

### 2. Configure Backend

```bash
cd backend
# Edit .env file with your PostgreSQL credentials
# DB_USER=postgres
# DB_PASSWORD=your_password
npm install
```

### 3. Seed Demo Data

```bash
cd backend
npm run seed
```

### 4. Start Backend

```bash
cd backend
npm run dev
```

Server runs at `http://localhost:5000`

### 5. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

## Demo Credentials

| Role    | Email                     | Password    |
|---------|---------------------------|-------------|
| Admin   | admin@coreinventory.com   | password123 |
| Manager | john@coreinventory.com    | password123 |
| Staff   | jane@coreinventory.com    | password123 |

## Core Features

- ✅ User Authentication (Login/Signup/Logout)
- ✅ Dashboard with KPIs and Charts
- ✅ Product Management (CRUD + Search)
- ✅ Receipts (Incoming Stock)
- ✅ Deliveries (Outgoing Stock)
- ✅ Internal Transfers
- ✅ Stock Adjustments
- ✅ Stock Movement History
- ✅ Low Stock Alerts (< 10 quantity)
- ✅ Multi-warehouse Support
- ✅ Search by SKU or Product Name

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/signup` | Register |
| POST | `/api/auth/login` | Login |
| GET | `/api/dashboard/stats` | KPI stats |
| GET | `/api/dashboard/chart` | Chart data |
| GET | `/api/dashboard/low-stock` | Low stock alerts |
| GET/POST | `/api/products` | Product CRUD |
| GET/POST | `/api/warehouses` | Warehouse CRUD |
| GET/POST | `/api/receipts` | Receipt operations |
| PUT | `/api/receipts/:id/validate` | Validate receipt |
| GET/POST | `/api/deliveries` | Delivery operations |
| PUT | `/api/deliveries/:id/validate` | Validate delivery |
| GET/POST | `/api/transfers` | Transfer operations |
| PUT | `/api/transfers/:id/validate` | Validate transfer |
| GET/POST | `/api/adjustments` | Stock adjustments |
| GET | `/api/stock-history` | Movement history |

## Architecture

```
CoreInventory/
├── backend/
│   ├── config/         # Database configuration
│   ├── middleware/      # JWT auth middleware
│   ├── models/          # Sequelize models
│   ├── routes/          # Express route handlers
│   ├── seeders/         # Demo data seeder
│   └── server.js        # Express app entry
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── context/     # React context (Auth)
│   │   ├── pages/       # Page components
│   │   ├── services/    # API client
│   │   └── App.jsx      # Root component
│   └── tailwind.config.js
└── README.md
```
