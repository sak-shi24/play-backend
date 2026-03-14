# 🎮 Play Backend

A full-featured **Node.js + Express + MySQL** backend for an online gaming challenge platform. Players can create and accept challenges, manage wallets, deposit and withdraw funds, and track results — all backed by a real-time admin panel with notifications.

---

## ✨ Features

- 🎯 **Challenge System** — Create, accept, and resolve 1v1 game challenges with room codes and screenshot proof
- 💰 **Wallet System** — Deposit, withdraw, and track balances per user
- 🔐 **Auth** — User registration & login with referral codes; separate admin auth
- 📢 **Notifications** — Real-time notifications for users and admins on key events
- 🛠️ **Admin Panel API** — Manage users, deposits, withdrawals, challenge results, and help requests
- 📁 **File Uploads** — Screenshot uploads via Multer for deposits and challenge results

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js >= 18 |
| Framework | Express 5 |
| Database | MySQL 8 (via `mysql2`) |
| Auth | bcryptjs + JWT |
| File Uploads | Multer |
| Deployment | Render |

---

## 📁 Project Structure

```
play-backend/
├── config/
│   └── db.js                 # MySQL connection pool
├── routes/
│   ├── auth.js               # User register, login, password reset
│   ├── wallet.js             # Balance, deposit, withdraw, transactions
│   ├── challenge.js          # Create, accept, submit results
│   ├── referral.js           # Referral system
│   ├── notifications.js      # User notifications
│   ├── admin.js              # Admin: users, deposits, withdrawals, challenges
│   ├── adminAuth.js          # Admin register & login
│   └── adminNotification.js  # Admin notifications
├── utils/
│   └── notification.js       # Shared helper to create notifications
├── uploads/                  # Uploaded files (excluded from git)
├── server.js                 # App entry point
├── package.json
├── render.yaml               # Render deployment config
└── .env.example              # Environment variable reference
```

---

## ⚙️ Setup & Installation

### Prerequisites

- Node.js >= 18
- MySQL 8 database (local or cloud — e.g. [PlanetScale](https://planetscale.com), [Railway](https://railway.app), [Aiven](https://aiven.io))

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/play-backend.git
cd play-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your database credentials (see [Environment Variables](#environment-variables) below).

### 4. Set up the database

Run the following SQL to create the required tables:

```sql
CREATE DATABASE play;
USE play;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  phone VARCHAR(20) UNIQUE,
  password VARCHAR(255),
  wallet DECIMAL(10,2) DEFAULT 0,
  referral_code VARCHAR(20),
  referred_by VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE wallets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  balance DECIMAL(10,2) DEFAULT 0
);

CREATE TABLE admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255)
);

CREATE TABLE challenges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  creator_id INT,
  joiner_id INT,
  amount DECIMAL(10,2),
  status VARCHAR(30) DEFAULT 'open',
  game_code VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE challenge_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  challenge_id INT,
  user_id INT,
  result VARCHAR(10),
  screenshot VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE deposits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  amount DECIMAL(10,2),
  screenshot VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE withdrawals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  amount DECIMAL(10,2),
  qr_image VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE deposit_qr (
  id INT AUTO_INCREMENT PRIMARY KEY,
  qr_image VARCHAR(255)
);

CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,
  admin TINYINT DEFAULT NULL,
  message VARCHAR(255),
  status VARCHAR(10) DEFAULT 'unread',
  is_read TINYINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE help_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  contact VARCHAR(100),
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  user_id INT DEFAULT NULL
);
```

### 5. Start the server

```bash
npm start
```

Server runs at `http://localhost:5000`

---

## 🔑 Environment Variables

Create a `.env` file in the project root (see `.env.example`):

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_HOST` | MySQL host | `mysql.railway.app` |
| `DB_USER` | MySQL username | `root` |
| `DB_PASSWORD` | MySQL password | `yourpassword` |
| `DB_NAME` | Database name | `play` |
| `DB_PORT` | MySQL port | `3306` |
| `PORT` | Server port (auto-set on Render) | `5000` |
| `ALLOWED_ORIGINS` | Comma-separated allowed CORS origins (optional) | `https://yourapp.com` |

---

## 📡 API Endpoints

Base URL: `https://your-service.onrender.com`

### 🔐 Auth — `/api/auth`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register a new user |
| POST | `/login` | Login with phone & password |
| POST | `/check-user` | Check if phone exists |
| POST | `/reset-password` | Reset password by phone |

### 💼 Wallet — `/api/wallet`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/balance/:userId` | Get wallet balance |
| GET | `/profile/:id` | Get user profile |
| POST | `/profile/update` | Update profile |
| GET | `/qr` | Get deposit QR image |
| POST | `/deposit` | Submit deposit request (with screenshot) |
| POST | `/withdraw` | Submit withdrawal request (with QR image) |
| GET | `/transactions/:user_id` | Get all transactions |
| POST | `/help-request` | Submit a help request |

### 🎮 Challenge — `/api/challenge`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/create` | Create a new challenge |
| POST | `/accept` | Accept an open challenge |
| GET | `/list/:userId` | List open & user challenges |
| POST | `/create-room` | Set game room code |
| GET | `/room-code/:id` | Get room code for a challenge |
| POST | `/submit-result` | Submit result with screenshot |

### 🔔 Notifications — `/api/notifications`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/count/:userId` | Get unread notification count |
| GET | `/:userId` | Get all notifications for user |
| POST | `/read/:id` | Mark notification as read |

### 🛡️ Admin Auth — `/api/adminAuth`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register admin |
| POST | `/login` | Admin login |

### 🛠️ Admin — `/api/admin`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stats` | Dashboard stats |
| GET | `/users` | All users |
| GET | `/challenges` | All challenges |
| GET | `/challenge-results` | All challenge results |
| POST | `/challenge-results/verify` | Approve/reject a result |
| GET | `/deposits` | All deposits |
| POST | `/deposit/approve/:id` | Approve deposit |
| POST | `/deposit/reject/:id` | Reject deposit |
| POST | `/upload-qr` | Upload deposit QR image |
| GET | `/withdrawals` | All withdrawals |
| POST | `/withdrawals/approve/:id` | Approve withdrawal |
| POST | `/withdrawals/reject/:id` | Reject withdrawal |
| GET | `/help-requests` | All help requests |
| POST | `/help-request/resolve` | Resolve a help request |
| GET | `/notifications` | Admin notifications |
| GET | `/notifications/count` | Unread admin notification count |

### 📢 Admin Notifications — `/api/admin/notification`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | All admin notifications |
| GET | `/count` | Unread count |
| POST | `/read/:id` | Mark as read |

---

## 🚀 Deployment on Render

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/play-backend.git
git branch -M main
git push -u origin main
```

### 2. Create a Web Service on Render

1. Go to [render.com](https://render.com) → **New** → **Web Service**
2. Connect your GitHub repository
3. Set the following:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Runtime:** Node

### 3. Set Environment Variables

In your Render service dashboard → **Environment**, add:

```
DB_HOST       = your_mysql_host
DB_USER       = your_mysql_user
DB_PASSWORD   = your_mysql_password
DB_NAME       = play
DB_PORT       = 3306
```

### 4. Deploy

Click **Deploy** — Render will build and start the server automatically. Your API will be live at:

```
https://your-service-name.onrender.com
```

> ⚠️ **Note on file uploads:** Render's filesystem is ephemeral — uploaded files are deleted on every redeploy. For production, integrate a cloud storage service like [Cloudinary](https://cloudinary.com) or [AWS S3](https://aws.amazon.com/s3/) for persistent file storage.

---

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
