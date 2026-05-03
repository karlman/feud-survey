# Feud Survey

A Next.js web app for collecting Family Feud survey responses, with AI-powered tabulation.

## What it does
- Admins create surveys with questions and metadata
- A QR code is generated linking to the public survey form
- Respondents scan the QR code and answer questions anonymously
- Admin monitors response counts per question (targeting 100 per question)
- AI (Claude) groups similar answers, filters junk, and scores quality
- Results export as JSON matching the Family Feud Pi app format

## Stack
- **Next.js 14** with App Router and TypeScript
- **Prisma** ORM with **PostgreSQL** (Azure Database for PostgreSQL in production)
- **Tailwind CSS** for styling
- **Anthropic SDK** for AI tabulation (`claude-opus-4-5`)
- **jose** for JWT session management
- **qrcode** for QR code generation

## Local development
```bash
# 1. Start Postgres
docker compose up -d

# 2. Copy env file and fill in values
cp .env.local.example .env.local

# 3. Install deps and push schema
npm install
npm run db:push

# 4. Start dev server
npm run dev
```

## Key routes
- `/admin` — survey dashboard (requires auth)
- `/admin/surveys/new` — create a survey
- `/admin/surveys/[id]` — edit survey, view QR code, lock/unlock
- `/admin/surveys/[id]/results` — response counts, AI tabulation, export
- `/survey/[token]` — public survey form (no auth required)
- `/login` — admin login

## API routes
- `GET/POST /api/surveys` — list / create surveys
- `GET/PUT/DELETE /api/surveys/[id]` — get / update / delete a survey
- `POST /api/surveys/[id]/lock` — toggle lock state
- `POST /api/surveys/[id]/tabulate` — run AI tabulation (calls Claude)
- `GET /api/surveys/[id]/export` — download Family Feud JSON
- `GET/POST /api/submit/[token]` — public: get survey form / submit answers

## Auth
Simple JWT cookie auth. Set `ADMIN_PASSWORD` in `.env.local`.
Session cookie (`admin-session`) is valid for 7 days.

## Export format
Matches the format expected by the Family Feud Pi app:
```json
{
  "title": "Survey Title",
  "rounds": [
    {
      "question": "Name something in a kitchen",
      "answers": [
        { "text": "Refrigerator", "points": 45 },
        { "text": "Stove", "points": 22 }
      ]
    }
  ]
}
```
Points are scaled so the total across all answers ≈ 100.

## Production (Azure)
Deploy to Azure App Service (Node.js).
Set env vars in App Service Configuration:
- `DATABASE_URL` — Azure Database for PostgreSQL connection string
- `ADMIN_PASSWORD`
- `SESSION_SECRET` — long random string
- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_APP_URL` — your Azure domain
