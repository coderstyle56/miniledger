# MiniLedger

Track money lent to friends. Node.js + TypeScript + PostgreSQL backend, React Native (Expo) app.

## Features
- Phone login with mock OTP (OTP is printed in the server log)
- Add a loan entry (friend name, amount, due date), mark it as repaid
- Summary: total lent, total repaid, overdue amount
- Overdue entries highlighted in the app
- Input validation on both app and server

## Tech
- Backend: Express, TypeScript, `pg`, JWT
- Database: PostgreSQL 16 (Docker)
- App: React Native with Expo, `expo-secure-store` for the token

## Prerequisites
Node.js (LTS), Docker Desktop, Expo Go on your phone (same Wi-Fi as your laptop).

## Run it

### 1. Database
```bash
docker compose up -d
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env     # Windows: copy .env.example .env
npm run migrate          # creates the tables
npm run dev              # http://localhost:4000
```
Note: if port 5433 is taken on your machine, change it in `docker-compose.yml` and `DATABASE_URL`.

### 3. App
Find your laptop's local IP (`ipconfig` on Windows, `ifconfig` on Mac/Linux) and set it in `app/src/config.ts`:
```ts
export const API_URL = "http://<your-ip>:4000";
```
```bash
cd app
npm install
npx expo start
```
Scan the QR code with Expo Go.

### Login
Enter any 10-digit phone number, tap Send OTP, then read the OTP from the **backend terminal** (`[MOCK OTP] ...`).

## API
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /auth/send-otp | no | Generates OTP, prints it to server log |
| POST | /auth/verify-otp | no | Verifies OTP, returns JWT |
| POST | /loans | yes | Add loan `{friend_name, amount, due_date}` |
| GET | /loans | yes | List loans (with `is_overdue`) |
| PATCH | /loans/:id/repay | yes | Mark as repaid |
| GET | /summary | yes | `{total_lent, total_repaid, overdue_amount}` |

## Design decisions
- `NUMERIC(12,2)` for money, not float, to avoid rounding errors.
- Overdue = `NOT is_repaid AND due_date < CURRENT_DATE`, computed in SQL so list and summary always agree.
- Every loan query filters by `user_id`, so users can only touch their own data.
- OTPs expire in 5 minutes and are deleted after use.
- Parameterized queries everywhere (no SQL injection).

## Request flow
App -> `POST /auth/send-otp` -> OTP saved in DB and logged -> `POST /auth/verify-otp` -> JWT stored in SecureStore -> every later request sends `Authorization: Bearer <token>` -> `requireAuth` middleware sets `userId` -> routes query only that user's rows.

## Not done
Receipt upload and automated tests (time).