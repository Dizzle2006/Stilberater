# 👗 Style Assistant

Persönlicher KI-Stil-Assistent mit virtuellem Kleiderschrank, Outfit-Generator und Einkaufs-Empfehlungen.

## Tech Stack

- **Backend**: FastAPI + SQLAlchemy + SQLite + OpenAI GPT-4o Vision
- **Frontend**: React 18 + Vite + Zustand + TypeScript
- **Container**: Docker Compose

## Setup (5 Minuten)

### 1. Repo klonen / Ordner öffnen
```bash
cd style-assistant
```

### 2. Environment einrichten
```bash
cp .env.example .env
# .env öffnen und OPENAI_API_KEY eintragen
# (optional — App läuft auch ohne Key mit Fallback-Analyse)
```

### 3. Docker starten
```bash
docker compose up --build
```

### 4. App öffnen
- Frontend: http://localhost:5173
- API Docs: http://localhost:8000/docs

## Ohne Docker (lokale Entwicklung)

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Features

| Feature | Beschreibung |
|---|---|
| 📸 Upload | Foto hochladen → GPT-4o Vision analysiert Farbe, Typ, Stil automatisch |
| 👕 Schrank | Virtueller Kleiderschrank mit Filterfunktion nach Kategorie |
| ✨ Outfit-Generator | KI kombiniert Items nach Farbtheorie + Stil-Konsistenz |
| 🛍️ Lücken-Analyse | Erkennt fehlende Basics mit Zalando/Amazon Links |
| 🗑️ Purge-Engine | Items die kaum getragen werden oder nicht mehr passen |
| 👤 Stil-Profil | Onboarding-Quiz für Personas, Farben, Budget, Anlässe |

## Erweiterungen (nächste Schritte)

- [ ] CLIP-Embeddings für bessere Item-Ähnlichkeit
- [ ] Collaborative Filtering (ähnliche User-Stile)
- [ ] Vinted API Integration (direkt verkaufen)
- [ ] Weather API → tagesaktuelle Outfit-Vorschläge
- [ ] iOS/Android App (React Native)
- [ ] Barcode-Scanner für Marken-Erkennung

## API Docs

FastAPI generiert automatisch interaktive Swagger-Docs:
→ http://localhost:8000/docs
