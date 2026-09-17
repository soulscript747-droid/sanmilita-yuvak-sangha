# Sanmilita Yuvak Sangha, Tezpur

Premium bilingual Assamese cultural organization website.

## Run locally

```bash
npm install
ADMIN_PASSWORD="choose-a-strong-password" SESSION_SECRET="replace-with-a-long-random-secret" npm start
```

Open `http://localhost:3000/`.

Admin login is at `http://localhost:3000/admin.html` if the admin page is present in the project.

## Deploy

This project is prepared for Node/Express hosting. Set `ADMIN_PASSWORD`, `SESSION_SECRET`, and optionally `ADMIN_EMAIL` as environment variables. Use the provider's persistent disk/storage if you want SQLite content and uploaded images to survive redeploys.
