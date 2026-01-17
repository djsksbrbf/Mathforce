# Problem Trainer

## Quick start (Docker)
1. `docker compose up --build`
2. API runs at `http://localhost:8000`
3. Frontend runs at `http://localhost:5173`

## Local dev (optional)
Backend:
- `cd backend`
- `python -m venv .venv`
- `./.venv/Scripts/activate` (PowerShell)
- `pip install -r requirements.txt`
- `uvicorn app.main:app --reload`

Frontend:
- `cd frontend`
- `npm install`
- `npm run dev`

## Environment
Backend env vars (defaults included in `app/config.py`):
- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGINS`

Frontend env vars:
- `VITE_API_URL`

## Notes
- The backend seeds a small set of topics/problems on startup if none exist.
