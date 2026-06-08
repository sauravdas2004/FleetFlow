# FleetFlow – Realtime Fleet Tracking & Logistics Platform

## Quick Start

### Prerequisites
- Node.js 20+
- MongoDB (local or Atlas)
- Redis (optional, for caching/queues)

### 1. Start MongoDB & Redis (Docker)
```bash
docker compose up mongodb redis -d
```

### 2. Backend
```bash
cd backend
npm install
npm run seed
npm run dev
```
API: **http://localhost:5000**

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
App: **http://localhost:5173**

## Demo Accounts
| Role     | Email                  | Password       |
|----------|------------------------|----------------|
| Admin    | admin@fleetflow.io     | Admin@12345    |
| Driver   | driver1@fleetflow.io   | Driver@12345   |
| Customer | john@example.com       | Customer@123   |
