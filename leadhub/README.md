# LeadHub — IndiaMART Lead Automation (by Odd Infotech)

A multi-tenant SaaS dashboard that pulls IndiaMART leads, auto-sends proposal
emails and WhatsApp greetings, scores leads with Gemini AI, and streams
everything live to the dashboard. Every customer connects **their own**
IndiaMART API key, SMTP email, WhatsApp number, and Gemini key from an
in-app Settings panel — nothing is pre-configured or shared.

## Project structure

```
leadhub/
  backend/     Node.js + Express + MongoDB API, WhatsApp/email/AI services
  frontend/    React + Vite + Tailwind dashboard
```

## 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env: set MONGO_URI, JWT_SECRET, ENCRYPTION_KEY
npm run dev
```

Requires MongoDB running locally or a connection string (MongoDB Atlas works
fine). The server starts on `http://localhost:5000`.

**Note on WhatsApp:** `whatsapp-web.js` drives a real headless Chromium
browser per connected user, so the backend host needs Chromium/Puppeteer
dependencies available (works out of the box on most Linux/Mac/Windows dev
machines; on a bare Linux server you may need to `apt install` a few
Chromium libs — see the whatsapp-web.js docs for your OS).

## 2. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Opens on `http://localhost:5173`. Register an account, then follow the
onboarding wizard to connect IndiaMART, email, WhatsApp, and Gemini AI.

## 3. Where each requirement lives

| Requirement | Implementation |
|---|---|
| Centralized lead dashboard, filter/search | `frontend/src/pages/Dashboard.jsx`, `backend/routes/leads.js` |
| Auto email + WhatsApp outreach on new lead | `backend/services/indiamartService.js` (`processNewLead`), `emailService.js`, `whatsappService.js` |
| Real-time live activity stream (SSE) | `backend/services/sseService.js`, `backend/routes/sse.js`, `frontend/src/hooks/useLiveFeed.js`, `ActivityTicker.jsx` |
| AI lead scoring & summaries (Gemini) | `backend/services/geminiService.js` |
| Manual settings: API key, email, WhatsApp QR, templates | `backend/routes/settings.js`, `backend/routes/whatsapp.js`, `frontend/src/pages/Settings.jsx`, `Onboarding.jsx` |

## 4. Security notes for a resale product

- Every credential (IndiaMART key, SMTP password, Gemini key) is encrypted
  at rest with AES-256-GCM before being saved to MongoDB — see
  `backend/config/crypto.js`. Set a strong, unique `ENCRYPTION_KEY` per
  deployment.
- Secrets are never sent back to the browser in plaintext; the Settings API
  returns masked previews only (`backend/routes/settings.js`).
- Each user's WhatsApp session is isolated (`whatsapp-web.js` `LocalAuth`
  keyed by user ID), so customers never see each other's chats or leads —
  all data is scoped by `user` on every MongoDB query.

## 5. Before you resell this

- **IndiaMART API**: confirm the exact endpoint/params in your IndiaMART
  seller panel's CRM Integration docs — IndiaMART has revised this API
  before, and `backend/services/indiamartService.js` has one clearly marked
  spot (`IM_BASE_URL` and `mapImLeadToDoc`) to adjust field names if theirs
  differ from what's assumed here.
- **WhatsApp automation**: automating WhatsApp via unofficial libraries
  (like `whatsapp-web.js`) can get a number rate-limited or banned by Meta
  if used aggressively — recommend customers use a secondary/business
  number, not their primary line, and keep sending volume reasonable.
- **Gemini pricing**: each customer's own Gemini key is billed to them
  directly by Google, so your running costs stay at zero for AI usage.
