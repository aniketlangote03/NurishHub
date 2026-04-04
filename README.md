# 🍱 NurishHub — Food Donation & Redistribution System

A premium, full-stack MERN application for food donation and redistribution. It connects donors, NGOs, and volunteers through a structured workflow with features like NGO request handling, admin-controlled volunteer assignment, real-time status tracking, and location-based coordination.

---

## 🚀 Deployment Guide

This project is designed to be deployed with **Render** (Backend) and **Netlify** (Frontend).

### 1. Backend (Render)
Deploy the `/backend` directory as a **Web Service**.

**Required Environment Variables:**
| Key | Value / Source |
|:---|:---|
| `NODE_ENV` | `production` |
| `MONGO_URI` | Your MongoDB Atlas SRV string |
| `JWT_SECRET` | 64-char random hex string |
| `JWT_REFRESH_SECRET` | 64-char random hex string (different from above) |
| `CLIENT_URL` | Your Netlify site URL (e.g. `https://name.netlify.app`) |
| `SOCKET_CORS_ORIGIN` | Same as `CLIENT_URL` |

> [!TIP]
> Use names like `nurishhub-api` for your Render service. Ensure **Network Access** in MongoDB Atlas allows connections from Render (or `0.0.0.0/0` during initial setup).

### 2. Frontend (Netlify)
Deploy the `/frontend` directory.

**Required Environment Variables:**
| Key | Value / Source |
|:---|:---|
| `VITE_API_URL` | `https://your-service.onrender.com/api` |
| `VITE_SOCKET_URL` | `https://your-service.onrender.com` |

---

## 🛠️ Local Development

1. **Setup .env**: Copy `backend/.env.example` to `backend/.env` and fill in local values.
2. **Install**: `npm install` in both `backend/` and `frontend/`.
3. **Seed Data**: Run `node backend/seed.js` to populate demo accounts.
4. **Run**: 
   - Backend: `cd backend && npm run dev`
   - Frontend: `cd frontend && npm run dev`
