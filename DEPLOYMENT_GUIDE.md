# 🚀 Taash (Mindi Coat) — Single-Server Production Deployment Guide

This guide explains how to deploy the entire **Taash Multiplayer Game** (React Frontend + Node.js API + Real-time WebSockets + PostgreSQL Database) onto a single VPS, Cloud Server (DigitalOcean, AWS EC2, Hetzner, Linode), or bare-metal server using **Docker & Docker Compose**.

---

## 📋 Architecture Overview

- **Unified Single-Server Architecture**: The frontend SPA is pre-compiled and served directly from the Node.js production server on port `8080`, alongside all REST API routes and real-time WebSocket game/voice connections.
- **PostgreSQL 16**: Automatically orchestrated in a container with a persistent Docker data volume (`postgres_data`).
- **Nginx Reverse Proxy**: Forwards standard HTTP/HTTPS traffic (port 80/443) and handles WebSocket protocol upgrades (`ws://` / `wss://`).

---

## 🛠️ Step 1: Server Setup & Prerequisites

On your Ubuntu/Debian VPS, install Docker and Docker Compose:

```bash
# 1. Update package list
sudo apt update && sudo apt upgrade -y

# 2. Install Docker & Docker Compose plugin
sudo apt install -y docker.io docker-compose-v2 git

# 3. Enable and start Docker service
sudo systemctl enable --now docker
```

---

## 📦 Step 2: Clone the Repository & Configure Environment

```bash
# 1. Clone your project repository
git clone <YOUR_REPOSITORY_URL> /opt/taash
cd /opt/taash

# 2. Create your production environment file
cp .env.example .env 2>/dev/null || cat << 'EOF' > .env
# Production PostgreSQL Configuration
POSTGRES_USER=taash_admin
POSTGRES_PASSWORD=generate_a_strong_password_here_123!
POSTGRES_DB=taash_production_db

# Security & Secrets
JWT_SECRET=generate_a_random_64_char_secret_key_here!

# Server Port
PORT=8080
EOF
```

> 💡 **Tip**: Replace `POSTGRES_PASSWORD` and `JWT_SECRET` with strong, random strings.

---

## 🚀 Step 3: Launch with Docker Compose

Run a single command to build the frontend, compile the backend, generate the Prisma client, push database tables, and start all containers in detached mode:

```bash
docker compose up -d --build
```

### Check Container Status & Logs

```bash
# View running containers
docker compose ps

# View live application logs
docker compose logs -f app
```

Once started, your game will be accessible at:
👉 `http://YOUR_SERVER_IP:8080`

---

## 🔒 Step 4: Domain & Free SSL Setup (HTTPS & WSS)

To enable secure WebSockets (`wss://`) and WebRTC audio over HTTPS:

### 1. Install Nginx & Certbot on the Host

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 2. Configure Nginx Site

Create `/etc/nginx/sites-available/taash`:

```nginx
server {
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;

        # WebSocket Upgrade Headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}
```

Enable the configuration:

```bash
sudo ln -s /etc/nginx/sites-available/taash /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 3. Obtain Free Let's Encrypt SSL Certificate

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot will automatically configure HTTPS certificates and auto-renewal.

---

## 🔄 Updating the App (Zero-Downtime Updates)

Whenever you push code updates to Git:

```bash
cd /opt/taash
git pull origin main
docker compose up -d --build
```

Docker will rebuild the images and seamlessly recreate the application container with no database data loss.

---

## 🛠️ Handy Commands

| Task | Command |
| :--- | :--- |
| **Restart App** | `docker compose restart app` |
| **Stop Everything** | `docker compose down` |
| **View Live Game Logs** | `docker compose logs -f --tail=100 app` |
| **Run Prisma Studio (GUI)** | `docker compose exec app npx prisma studio` |
| **Database Backup** | `docker compose exec postgres pg_dump -U taash_admin taash_production_db > backup.sql` |
