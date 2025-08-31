# Local Development Setup

## 1. Install Dependencies
npm install
cd frontend && npm install && cd ..

## 2. Setup Environment
cp .env.example .env
# Edit .env with:
# MONGODB_URI=mongodb://localhost:27017/docforge-local
# JWT_SECRET=your-local-secret-key
# API_PORT=3001
# FRONTEND_PORT=3000

## 3. Start MongoDB (Docker)
docker run -d --name mongo-local -p 27017:27017 mongo:latest

## 4. Start API Server
npm run dev-api
# OR
node api/server.js

## 5. Start Frontend (New Terminal)
cd frontend
npm run dev
# OR
npm start

## 6. Access Application
- Frontend: http://localhost:3000
- API: http://localhost:3001/api/health

## 7. Create Your First Tenant
- Go to http://localhost:3000/create-tenant
- Fill in organization details
- Copy the API key
- Use it to access the platform
