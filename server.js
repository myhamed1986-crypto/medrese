require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '200kb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files (the site)
app.use(express.static(path.join(__dirname)));

function safeAppendLog(obj) {
  try {
    const logPath = path.join(__dirname, 'messages.log');
    const line = JSON.stringify({ time: new Date().toISOString(), data: obj }) + os.EOL;
    fs.appendFileSync(logPath, line, { encoding: 'utf8' });
  } catch (e) {
    console.error('Failed to write message log', e);
  }
}

app.post('/api/applications', (req, res) => {
  try {
    const { fullName, phone, email, type, program, message } = req.body || {};
    if (!fullName || !phone) {
      return res.status(400).json({ success: false, message: 'fullName and phone are required' });
    }

    const payload = { fullName, phone, email: email || null, type: type || null, program: program || null, message: message || null };

    // save to messages.log
    safeAppendLog(payload);

    // Optionally send email if SMTP settings provided
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.NOTIFY_EMAIL) {
      // lazy-load nodemailer to keep startup fast when not configured
      try {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
          secure: process.env.SMTP_SECURE === '1' || process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        const text = Object.entries(payload).map(([k,v]) => `${k}: ${v}`).join('\n');
        transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: process.env.NOTIFY_EMAIL,
          subject: `New application (${payload.type || 'contact'})`,
          text
        }).catch(err => console.error('Mail send failed', err));
      } catch (e) {
        console.error('nodemailer not available or failed', e);
      }
    }

    // Telegram notification (optional)
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      try {
        const https = require('https');
        const bot = process.env.TELEGRAM_BOT_TOKEN;
        const chat = process.env.TELEGRAM_CHAT_ID;
        const lines = Object.entries(payload).map(([k, v]) => `${k}: ${v}`);
        const text = encodeURIComponent(`New application (${payload.type || 'contact'})\n` + lines.join('\n'));
        const url = `https://api.telegram.org/bot${bot}/sendMessage?chat_id=${chat}&text=${text}`;
        https.get(url, (res) => {
          // consume response data to free socket
          res.on('data', () => {});
        }).on('error', (err) => console.error('Telegram send failed', err));
      } catch (e) {
        console.error('Telegram notify failed', e);
      }
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Error handling /api/applications', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.get('/healthz', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
