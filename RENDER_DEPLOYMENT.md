# 🚀 Deploying Taash to Render (Step-by-Step)

This guide walks you through deploying your **Taash Multiplayer Game** (React + Node.js API + WebSockets + PostgreSQL) to [Render](https://render.com).

---

## ⚡ Method 1: 1-Click Blueprint Deployment (Recommended)

Because we added [`render.yaml`](file:///d:/taash/render.yaml) to your repository, Render can automatically create and link both the **PostgreSQL Database** and the **Docker Web Service** in one click.

### Steps:
1. **Push your code to GitHub / GitLab**.
2. Go to your [Render Dashboard](https://dashboard.render.com).
3. Click **New +** → **Blueprint**.
4. Connect your **Taash repository**.
5. Render will automatically detect `render.yaml` and configure:
   - **PostgreSQL Database (`taash-db`)**
   - **Docker Web Service (`taash-game`)**
   - Environment variables (`DATABASE_URL`, auto-generated `JWT_SECRET`, and `NODE_ENV=production`).
6. Click **Apply**.
7. Wait 2–3 minutes for the build and deployment to complete.
8. Your game is live at: `https://taash-game-xxxx.onrender.com`!

---

## 🛠️ Method 2: Manual Setup via Render Dashboard

If you prefer to configure services manually in Render:

### Step 1: Create PostgreSQL Database
1. In Render Dashboard, click **New +** → **PostgreSQL**.
2. Set:
   - **Name**: `taash-db`
   - **Database**: `taash_db`
   - **User**: `taash_user`
   - **Plan**: Free (or Starter)
3. Click **Create Database**.
4. Under the database details page, copy the **Internal Database URL** (e.g. `postgresql://taash_user:...@dpg-.../taash_db`).

### Step 2: Create Web Service
1. In Render Dashboard, click **New +** → **Web Service**.
2. Connect your Git repository.
3. Configure the settings:
   - **Name**: `taash-game`
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `./Dockerfile`
   - **Plan**: Free (or Starter)
4. Under **Environment Variables**, add:
   | Key | Value |
   | :--- | :--- |
   | `DATABASE_URL` | *(Paste Internal Database URL from Step 1)* |
   | `JWT_SECRET` | *(Enter a secure random 32+ character string)* |
   | `NODE_ENV` | `production` |
5. Under **Health Check Path**, enter: `/api/health`.
6. Click **Deploy Web Service**.

---

## 🔍 How it Works on Render
- **Single URL**: Both frontend and backend run on the same Render URL. No CORS or cross-domain issues.
- **Real-time WebSockets**: WebSockets (`wss://`) work out of the box through Render's SSL proxy without any extra reverse proxy setup.
- **Automatic Database Migrations**: On every deploy/start, `npm run start:prod` automatically runs `prisma db push` to ensure all database tables are created.
