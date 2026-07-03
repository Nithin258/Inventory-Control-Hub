# Omnichannel Real-Time Inventory Control Hub

A full-stack inventory management dashboard with real-time updates, multi-channel sales tracking (Amazon, Shopify, Website, Store), low-stock alerts, and analytics.

## Stack
- **Frontend:** React + TypeScript, Tailwind CSS, shadcn/ui, Recharts, Socket.IO client
- **Backend:** Node.js + Express, PostgreSQL, Redis, Socket.IO

## Project Structure
```
inventory-hub/
├── backend/
│   ├── src/
│   │   ├── db/            # DB pool + schema + seed
│   │   ├── routes/        # Express routes
│   │   ├── controllers/   # Route handlers
│   │   ├── models/        # SQL query functions
│   │   ├── sockets/       # Socket.IO event handlers
│   │   ├── middleware/    # Error handling, validation
│   │   ├── utils/         # Redis client, cache helpers
│   │   └── server.js      # Entrypoint
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/    # UI + dashboard widgets
    │   ├── pages/         # Dashboard page
    │   ├── hooks/         # useSocket, useInventory, etc.
    │   ├── lib/            # api client, utils
    │   ├── types/
    │   └── App.tsx
    ├── package.json
    └── .env.example
```

## Quick Start

### 1. Database (PostgreSQL)
```bash
createdb inventory_hub
cd backend
npm install
cp .env.example .env      # edit DB_URL, REDIS_URL
npm run migrate           # creates tables
npm run seed               # inserts demo data
npm run dev                 # starts on :4000
```

### 2. Redis
```bash
redis-server
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env      # set VITE_API_URL=http://localhost:4000
npm run dev                 # starts on :5173
```

Open http://localhost:5173 — the dashboard connects to the backend via REST + Socket.IO for live stock/sales updates.

## Features
- Live inventory overview with real-time stock changes pushed via Socket.IO
- Product stock cards with per-product SKU, quantity, reorder threshold
- Sales-by-channel breakdown (Amazon / Shopify / Website / Store)
- Low-stock alert feed (threshold-based, real-time)
- Revenue analytics (daily/weekly/monthly aggregation)
- Top-selling products ranking
- Interactive charts (line, bar, pie) with date-range + channel filters
- Warehouse location map (static multi-warehouse stock view)
- Sales trend charts

## Environment Variables

**backend/.env**
```
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/inventory_hub
REDIS_URL=redis://localhost:6379
CORS_ORIGIN=http://localhost:5173
```

**frontend/.env**
```
VITE_API_URL=http://localhost:4000
VITE_SOCKET_URL=http://localhost:4000
```

## Deploying
- Backend: Render/Railway/Fly.io (needs Postgres + Redis add-ons)
- Frontend: Vercel/Netlify (set `VITE_API_URL` to deployed backend URL)

## License
MIT
