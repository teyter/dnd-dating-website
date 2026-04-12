# D&DG Dating Website

In this project we implement a Dungeons & Dragons themed dating website featuring character-based profiles, admin passport verification.

## Authors

Teitur Guðmundarson

Silja Rós Svansdóttir Þormar

Iftejar Miah Viki

## Setup
```

git clone https://github.com/teyter/dnd-dating-website
cd dnd-dating-website
npm install
npm run dev        # development, localhost
npm start          # production, requires server.js
```

## App will be running on

`http://localhost:3000`

## Format code (Prettier)

`npm run format`

## Notes

- The SQLite database, `users.db` is created automatically on first run.
- Database files are ignored by git.
- Copy `.env.example` to `.env` and fill in your values before running.

## Admin Access

The admin monitoring page is available at `/admin`.
Set credentials via environment variables in `.env`.

Our Credentials:
- Username: `TheBoss`
- Password: `Hacker1.`

## Server Deployment (Production)

Requires nginx and OpenVPN access to the server.

**We have added a SSL certificate, that will be running on our server:**

```bash
sudo bash scripts/generate-ssl.sh
```

**To apply nginx config, you need to run:**
```bash
sudo cp nginx.conf /etc/nginx/nginx.conf
sudo nginx -t
sudo systemctl reload nginx
```

**Start the app:**
```bash
npm start
```