# DraftKit API Backend (MVP)

## Environment variables

Copy `.env.example` to `.env` and fill in:

- `PORT` (optional, default `3000`)
- `MONGODB_URI`
- `EXTERNAL_API_KEY`
- `APP_CLIENT_KEY`

## Run locally

```bash
npm install
npm run dev
```

## API endpoint

`GET /api/player/:playerId`

Requires header:

`Authorization: Bearer <APP_CLIENT_KEY>`

## Quick verification with curl

Missing auth (should be `401`):

```bash
curl -i http://localhost:3000/api/player/123
```

Authorized first request (should be `source: "external"`):

```bash
curl -i \
  -H "Authorization: Bearer $APP_CLIENT_KEY" \
  http://localhost:3000/api/player/123
```

Second authorized request for same ID (should be `source: "cache"`):

```bash
curl -i \
  -H "Authorization: Bearer $APP_CLIENT_KEY" \
  http://localhost:3000/api/player/123
```
