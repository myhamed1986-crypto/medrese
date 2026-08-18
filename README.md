# Medrese — local dev server

This repository contains a static frontend and a tiny Express API to receive form submissions locally.

Quick start (Node.js required):

1. Install dependencies:

```powershell
cd C:\Users\User\Desktop\medrese
npm install
```

2. Start the server:

```powershell
npm start
# server runs on http://localhost:3000
```

3. Open the site in your browser: http://localhost:3000

Form submissions will be appended to `messages.log` in the project root. To enable email notifications set the following environment variables before starting the server:

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `NOTIFY_EMAIL` (and optionally `SMTP_FROM`)
 - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `NOTIFY_EMAIL` (and optionally `SMTP_FROM`)

You can create a `.env` file in the project root (see `.env.example`) with these variables. The server will load them automatically and attempt to send an email notification for each submission.

Example (PowerShell):

```powershell
$env:SMTP_HOST = 'smtp.example.com'
$env:SMTP_PORT = '587'
$env:SMTP_USER = 'user@example.com'
$env:SMTP_PASS = 'password'
$env:NOTIFY_EMAIL = 'you@example.com'
npm start
```
