# Claude Code Prompts — Style Assistant Erweiterungen

Drei aufeinander aufbauende Prompts. Immer erst den vorherigen abschließen und
testen, bevor der nächste gestartet wird.

---

## Prompt 1 — Backend-Fundament

```
Du arbeitest im Ordner `backend/` eines FastAPI-Projekts namens Style Assistant.
Das Datenmodell liegt in `app/models/`, die DB-Session in `app/database.py`,
docker-compose.yml im Root-Ordner.

Führe folgende Änderungen durch — alle in einem Commit:

### 1. `ClothingItem`-Modell (`app/models/clothing_item.py`)
Füge nach dem Feld `created_at` ein neues Feld ein:
```python
purchased_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
```
Das Feld `season` existiert bereits als JSON-Liste — lass es unverändert.

### 2. CORS als Env-Variable (`app/main.py`)
Ersetze die hartcodierte CORS-Origin-Liste:
```python
allow_origins=["http://localhost:5173", "http://localhost:3000"],
```
durch eine Env-Variable:
```python
import os
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
```
Dann `allow_origins=ALLOWED_ORIGINS` setzen.

### 3. SQLite-Volume (`docker-compose.yml`)
Im `backend`-Service: Ersetze `DATABASE_URL=sqlite:///./style_assistant.db` durch
`DATABASE_URL=sqlite:////data/style_assistant.db`.

Füge unter `volumes` des backend-Service ein:
```yaml
- sqlite_data:/data
```

Füge am Ende der globalen `volumes`-Sektion ein:
```yaml
sqlite_data:
```

### 4. Purge-Engine: `purchased_at` nutzen (`app/services/recommendation_engine.py`)
In `purge_recommendations()`: Ersetze die Age-Berechnung
```python
age_days = (now - item.created_at.replace(tzinfo=timezone.utc)).days if item.created_at else 0
```
durch:
```python
reference_date = item.purchased_at or item.created_at
age_days = (now - reference_date.replace(tzinfo=timezone.utc)).days if reference_date else 0
```

### 5. `purchased_at` im Wardrobe-Router exponieren (`app/routers/wardrobe.py`)
- In `ItemUpdate` (Pydantic-Modell): `purchased_at: Optional[datetime] = None` hinzufügen
- In `_serialize()`: `"purchased_at": item.purchased_at.isoformat() if item.purchased_at else None` hinzufügen

### 6. DB-Migration
Da SQLite `ALTER TABLE` für neue Nullable-Columns unterstützt, füge in `app/database.py`
nach `Base.metadata.create_all` eine Migration via `text()` ein:
```python
from sqlalchemy import text
async with engine.begin() as conn:
    await conn.run_sync(Base.metadata.create_all)
    # purchased_at migration — safe to run multiple times
    try:
        await conn.execute(text(
            "ALTER TABLE clothing_items ADD COLUMN purchased_at DATETIME"
        ))
    except Exception:
        pass  # Column already exists
```

Danach: `uvicorn app.main:app --reload` starten und prüfen ob `/health` antwortet
und `/api/wardrobe/items` `purchased_at: null` in jedem Item enthält.
```

---

## Prompt 2 — Backend-Features

```
Du arbeitest im Ordner `backend/` eines FastAPI-Projekts (Style Assistant).
Prompt 1 wurde bereits ausgeführt — `purchased_at` existiert, CORS nutzt Env-Var,
SQLite liegt unter `/data/style_assistant.db`.

Führe folgende drei Features durch:

---

### Feature A: Outfit-History mit worn_at-Timestamps

**`app/models/outfit.py`** — In der `Outfit`-Klasse ergänzen:
```python
worn_dates: Mapped[list] = mapped_column(JSON, default=list)  # ISO-strings
```

**`app/database.py`** — Migration ergänzen (analog zu purchased_at):
```python
try:
    await conn.execute(text(
        "ALTER TABLE outfits ADD COLUMN worn_dates JSON DEFAULT '[]'"
    ))
except Exception:
    pass
```

**`app/routers/outfits.py`** — `mark_worn`-Endpoint erweitern:
```python
@router.post("/{outfit_id}/worn")
async def mark_worn(outfit_id: int, db: AsyncSession = Depends(get_db)):
    from datetime import datetime, timezone
    outfit = await db.get(Outfit, outfit_id)
    if not outfit:
        raise HTTPException(404, "Outfit nicht gefunden")
    outfit.times_worn += 1
    dates = list(outfit.worn_dates or [])
    dates.append(datetime.now(timezone.utc).isoformat())
    outfit.worn_dates = dates
    for item_id in (outfit.item_ids or []):
        item = await db.get(ClothingItem, item_id)
        if item:
            item.times_worn += 1
            item.last_worn = datetime.now(timezone.utc)
    await db.commit()
    return {"times_worn": outfit.times_worn, "worn_dates": outfit.worn_dates}
```

In `_serialize()` ergänzen: `"worn_dates": o.worn_dates or []`

**Neuer Endpoint** — Outfit-History abrufen:
```python
@router.get("/history")
async def outfit_history(limit: int = 30, db: AsyncSession = Depends(get_db)):
    """Gibt alle Outfits zurück die mindestens 1x getragen wurden, neueste zuerst."""
    q = select(Outfit).where(Outfit.times_worn > 0).order_by(Outfit.times_worn.desc()).limit(limit)
    result = await db.execute(q)
    return [_serialize(o) for o in result.scalars().all()]
```

**Outfit-Feedback (👍/👎)**: Der `feedback`-Endpoint existiert bereits in `outfits.py`.
Erweitere ihn so dass bei `rating >= 4` (👍) die Item-IDs des Outfits in
`profile.liked_item_ids` eingetragen werden, bei `rating <= 2` (👎) in
`profile.disliked_item_ids` (jeweils ohne Duplikate):
```python
@router.patch("/{outfit_id}/feedback")
async def feedback(outfit_id: int, body: OutfitFeedback, db: AsyncSession = Depends(get_db)):
    outfit = await db.get(Outfit, outfit_id)
    if not outfit:
        raise HTTPException(404, "Outfit not found")
    if body.rating is not None:
        outfit.rating = body.rating
        # Profil-Feedback
        profile_result = await db.execute(select(UserProfile).limit(1))
        profile = profile_result.scalar_one_or_none()
        if profile:
            liked = list(profile.liked_item_ids or [])
            disliked = list(profile.disliked_item_ids or [])
            for iid in (outfit.item_ids or []):
                if body.rating >= 4 and iid not in liked:
                    liked.append(iid)
                elif body.rating <= 2 and iid not in disliked:
                    disliked.append(iid)
            profile.liked_item_ids = liked
            profile.disliked_item_ids = disliked
    if body.is_favourite is not None:
        outfit.is_favourite = body.is_favourite
    await db.commit()
    return _serialize(outfit)
```

---

### Feature B: Wetter-API via Open-Meteo

Erstelle `app/services/weather.py`:
```python
"""
Weather service using Open-Meteo (no API key required).
https://open-meteo.com/en/docs
"""
import httpx
from typing import Optional

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

SEASON_MAP = {
    (12, 1, 2): "winter",
    (3, 4, 5): "spring",
    (6, 7, 8): "summer",
    (9, 10, 11): "autumn",
}

def _month_to_season(month: int) -> str:
    for months, season in SEASON_MAP.items():
        if month in months:
            return season
    return "spring"

def _temp_to_layer_advice(temp_c: float) -> str:
    if temp_c < 5:   return "Schwerer Mantel, Schal, wärmende Schichten"
    if temp_c < 12:  return "Jacke oder leichter Mantel empfohlen"
    if temp_c < 18:  return "Leichte Jacke oder Cardigan passt"
    if temp_c < 24:  return "Kein Outerwear nötig"
    return "Leichte, luftige Kleidung — es ist warm"

async def get_weather(lat: float = 48.1351, lon: float = 11.5820) -> dict:
    """Fetches current weather for given coordinates (default: Munich)."""
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,weathercode,windspeed_10m,precipitation",
        "hourly": "temperature_2m",
        "forecast_days": 1,
        "timezone": "auto",
    }
    async with httpx.AsyncClient(timeout=5.0) as client:
        resp = await client.get(OPEN_METEO_URL, params=params)
        resp.raise_for_status()
        data = resp.json()

    current = data.get("current", {})
    temp = current.get("temperature_2m", 15.0)
    wcode = current.get("weathercode", 0)
    wind = current.get("windspeed_10m", 0)
    precip = current.get("precipitation", 0)

    from datetime import datetime
    month = datetime.now().month
    season = _month_to_season(month)

    # Map WMO weather codes to simple description
    if wcode == 0:          desc = "Klarer Himmel"
    elif wcode in (1,2,3):  desc = "Teils bewölkt"
    elif wcode in range(45,58): desc = "Neblig"
    elif wcode in range(61,68): desc = "Regen"
    elif wcode in range(71,78): desc = "Schnee"
    elif wcode in range(80,83): desc = "Schauer"
    elif wcode in range(95,100): desc = "Gewitter"
    else:                   desc = "Wechselhaft"

    return {
        "temperature_c": round(temp, 1),
        "description": desc,
        "wind_kmh": round(wind, 1),
        "precipitation_mm": round(precip, 2),
        "season": season,
        "layer_advice": _temp_to_layer_advice(temp),
        "needs_umbrella": precip > 0.5 or wcode in range(61, 83),
        "weather_code": wcode,
    }
```

Erstelle `app/routers/weather.py`:
```python
from fastapi import APIRouter, Query
from app.services.weather import get_weather

router = APIRouter()

@router.get("/current")
async def current_weather(
    lat: float = Query(48.1351, description="Breitengrad"),
    lon: float = Query(11.5820, description="Längengrad"),
):
    return await get_weather(lat, lon)
```

In `app/main.py` registrieren:
```python
from app.routers import weather
app.include_router(weather.router, prefix="/api/weather", tags=["weather"])
```

`httpx` zu `requirements.txt` hinzufügen (falls nicht vorhanden).

---

### Feature C: CLIP-Similarity-Endpoint

Erstelle `app/services/clip_service.py`:
```python
"""
CLIP-based image similarity using sentence-transformers.
Model: clip-ViT-B-32 (~300 MB, lädt beim ersten Aufruf).
"""
from __future__ import annotations
import os
import numpy as np
from typing import Optional

_model = None

def _get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer("clip-ViT-B-32")
    return _model

def embed_image(image_path: str) -> Optional[list[float]]:
    """Gibt einen 512-dim CLIP-Vektor für ein Bild zurück."""
    if not os.path.exists(image_path):
        return None
    try:
        from PIL import Image
        model = _get_model()
        img = Image.open(image_path).convert("RGB")
        vec = model.encode(img, convert_to_numpy=True)
        return vec.tolist()
    except Exception:
        return None

def cosine_similarity(a: list[float], b: list[float]) -> float:
    va, vb = np.array(a), np.array(b)
    denom = np.linalg.norm(va) * np.linalg.norm(vb)
    return float(np.dot(va, vb) / denom) if denom > 0 else 0.0
```

In `app/routers/wardrobe.py` ergänzen:

```python
@router.get("/items/{item_id}/similar")
async def similar_items(item_id: int, top_k: int = 5, db: AsyncSession = Depends(get_db)):
    """Gibt die top_k ähnlichsten Items zurück (CLIP-Cosine-Similarity)."""
    from app.services.clip_service import embed_image, cosine_similarity
    item = await db.get(ClothingItem, item_id)
    if not item or not item.image_path:
        raise HTTPException(404, "Item oder Bild nicht gefunden")

    abs_path = "." + item.image_path  # image_path ist "/uploads/..."
    query_vec = embed_image(abs_path)
    if query_vec is None:
        raise HTTPException(500, "CLIP-Embedding konnte nicht berechnet werden")

    result = await db.execute(
        select(ClothingItem).where(ClothingItem.is_active == True, ClothingItem.id != item_id)
    )
    candidates = result.scalars().all()

    scored = []
    for c in candidates:
        if not c.image_path:
            continue
        c_path = "." + c.image_path
        c_vec = embed_image(c_path)
        if c_vec:
            sim = cosine_similarity(query_vec, c_vec)
            scored.append((_serialize(c), sim))

    scored.sort(key=lambda x: x[1], reverse=True)
    return [{"item": s[0], "similarity": round(s[1], 3)} for s in scored[:top_k]]
```

`sentence-transformers` und `Pillow` zu `requirements.txt` hinzufügen (falls nicht vorhanden).

---

**Abschluss-Test:**
1. `uvicorn app.main:app --reload`
2. GET `/api/weather/current` → JSON mit `temperature_c`, `season`, `layer_advice`
3. POST `/api/outfits/{id}/worn` → `worn_dates` enthält ISO-Timestamp
4. PATCH `/api/outfits/{id}/feedback` mit `{"rating": 5}` → Profile `liked_item_ids` aktualisiert
5. GET `/api/wardrobe/items/{id}/similar` → Liste mit `similarity`-Score
```

---

## Prompt 3 — Frontend

```
Du arbeitest im Ordner `frontend/src/` eines React 18 + TypeScript + Vite Projekts
(Style Assistant). Das Backend läuft auf `http://localhost:8000`.

Die App hat folgende Struktur:
- `App.tsx` — Router mit Routes: `/`, `/kleiderschrank`, `/produkte`, `/profil`
- `pages/OutfitsPage.tsx` — Haupt-Outfit-Seite
- `pages/WardrobePage.tsx` — Kleiderschrank
- `components/BottomNav.tsx` — Navigation
- `utils/api.ts` — alle API-Calls

Die neuen Backend-Endpoints aus Prompt 1+2 sind aktiv:
- GET `/api/weather/current?lat=X&lon=Y`
- POST `/api/outfits/{id}/worn` (gibt `worn_dates` zurück)
- PATCH `/api/outfits/{id}/feedback` mit `{rating: number}`
- GET `/api/outfits/history`
- GET `/api/wardrobe/items/{id}/similar`

Führe folgende Änderungen durch:

---

### 1. Error Boundary (`components/ErrorBoundary.tsx`)
Erstelle eine React Error-Boundary-Komponente:
```tsx
import { Component, ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }
  static getDerivedStateFromError(error: Error): State { return { error } }
  render() {
    if (this.state.error) return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
        <p style={{ fontSize: 32 }}>😕</p>
        <p>Etwas ist schiefgelaufen.</p>
        <button
          onClick={() => this.setState({ error: null })}
          style={{ marginTop: 12, padding: '8px 20px', borderRadius: 8,
                   background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer' }}
        >Neu laden</button>
      </div>
    )
    return this.props.children
  }
}
```
In `App.tsx` den `<main>`-Block mit `<ErrorBoundary>` umschließen.

---

### 2. Image-Skeleton (`components/ImageSkeleton.tsx`)
```tsx
import { useState } from 'react'

interface Props {
  src: string
  alt?: string
  style?: React.CSSProperties
  className?: string
}

export default function ImageSkeleton({ src, alt = '', style, className }: Props) {
  const [loaded, setLoaded] = useState(false)
  return (
    <div style={{ position: 'relative', ...style }} className={className}>
      {!loaded && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, var(--surface) 25%, var(--surface-hover,#e0e0e0) 50%, var(--surface) 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.4s infinite',
          borderRadius: 'inherit',
        }} />
      )}
      <img
        src={src} alt={alt}
        onLoad={() => setLoaded(true)}
        style={{ display: loaded ? 'block' : 'invisible', width: '100%', height: '100%',
                 objectFit: 'cover', borderRadius: 'inherit' }}
      />
    </div>
  )
}
```

Füge in `index.css` die Shimmer-Animation ein:
```css
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

Ersetze alle `<img>`-Tags in `WardrobePage.tsx` und in den Outfit-Karten
(suche nach `<img src=`) durch `<ImageSkeleton src=...>`.

---

### 3. Wetter-Widget in OutfitsPage
Füge am Anfang der `OutfitsPage.tsx` ein kompaktes Wetter-Widget ein.

Das Widget:
- Ruft `GET /api/weather/current` einmal beim Mount auf (mit `lat`/`lon` aus
  `navigator.geolocation.getCurrentPosition`, Fallback: München 48.1351/11.5820)
- Zeigt: Temperatur in °C, Wetter-Beschreibung, `layer_advice`
- Zeigt ein Regenschirm-Icon (☂️) wenn `needs_umbrella: true`
- Hat einen kleinen Hinweis "Outfits für heute" wenn `season` gesetzt ist
- Style: schmale Karte (padding 12px, border-radius 12px, background `var(--surface)`)
  direkt über dem Outfit-Grid

API-Funktion in `utils/api.ts` ergänzen:
```ts
getWeather: (lat = 48.1351, lon = 11.5820) =>
  fetch(`${BASE}/api/weather/current?lat=${lat}&lon=${lon}`).then(r => r.json()),
```

---

### 4. Outfit-History-Seite (`pages/HistoryPage.tsx`)
Erstelle eine neue Seite die:
- `GET /api/outfits/history` abruft
- Outfits als vertikale Liste zeigt, mit: Name/Anlass, Datum des letzten Tragens (`worn_dates` letzter Eintrag), Anzahl `times_worn`
- Jeder Eintrag hat einen 👍 und 👎 Button der `PATCH /api/outfits/{id}/feedback`
  mit `{rating: 5}` bzw. `{rating: 1}` aufruft
- Nach dem Feedback den Eintrag optimistisch aktualisiert (Button-Farbe wechselt)

In `utils/api.ts` ergänzen:
```ts
getOutfitHistory: (limit = 30) =>
  fetch(`${BASE}/api/outfits/history?limit=${limit}`).then(r => r.json()),
rateOutfit: (id: number, rating: number) =>
  fetch(`${BASE}/api/outfits/${id}/feedback`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating }),
  }).then(r => r.json()),
```

Route in `App.tsx` hinzufügen: `<Route path="/verlauf" element={<HistoryPage />} />`

---

### 5. Wochenkalender (`components/WeekCalendar.tsx`)
Erstelle eine Kalender-Komponente:
- Zeigt 7 Tage (Mo–So der aktuellen Woche)
- Pro Tag: kleines Slot-Feld das leer oder mit einem Outfit befüllt sein kann
- State: `Record<string, number>` (ISO-Datum → outfit_id), gespeichert in `localStorage`
  unter Key `"outfitCalendar"`
- Um ein Outfit einem Tag zuzuweisen: Drag-from-outfit-list-to-day ODER einfacher:
  ein "Heute tragen"-Button in der Outfit-Karte in `OutfitsPage.tsx`, der das Outfit
  dem heutigen Tag zuweist
- Beim Klick auf einen befüllten Tag: zeigt das Outfit-Bild (Item-Thumbnails)
- Widget ist faltbar (collapsed by default, expandierbar per Klick auf "📅 Wochenplan")

Integriere den `WeekCalendar` in `OutfitsPage.tsx` direkt unter dem Wetter-Widget.

---

### 6. "Ähnliche Items"-Button in WardrobePage
In der Item-Detailansicht in `WardrobePage.tsx`:
- Füge einen Button "Ähnliche Stücke" hinzu
- Bei Klick: `GET /api/wardrobe/items/{id}/similar` → zeigt die top-3-ähnlichsten
  Items als kleine Thumbnails in einem Popover/Overlay darunter

API-Funktion in `utils/api.ts`:
```ts
getSimilarItems: (id: number, topK = 3) =>
  fetch(`${BASE}/api/wardrobe/items/${id}/similar?top_k=${topK}`).then(r => r.json()),
```

---

### 7. Browser Push Notifications (Service Worker)
Erstelle `public/sw.js`:
```js
self.addEventListener('push', event => {
  const data = event.data?.json() || {}
  self.registration.showNotification(data.title || 'Style Assistant', {
    body: data.body || 'Dein Outfit des Tages wartet!',
    icon: '/icon.png',
    badge: '/icon.png',
  })
})
self.addEventListener('notificationclick', event => {
  event.notification.close()
  clients.openWindow('/')
})
```

Erstelle `utils/notifications.ts`:
```ts
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return false
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') return false
  await navigator.serviceWorker.register('/sw.js')
  return true
}

export function scheduleOutfitReminder() {
  // Verwendet setTimeout bis zum nächsten 08:00 Uhr für eine einmalige lokale Notification
  const now = new Date()
  const next8 = new Date(now)
  next8.setHours(8, 0, 0, 0)
  if (next8 <= now) next8.setDate(next8.getDate() + 1)
  const msUntil8 = next8.getTime() - now.getTime()
  setTimeout(() => {
    if (Notification.permission === 'granted') {
      new Notification('Style Assistant 👗', {
        body: 'Was trägst du heute? Dein Outfit des Tages wartet!',
        icon: '/icon.png',
      })
    }
    // Wiederholen nach 24h
    setInterval(() => {
      if (Notification.permission === 'granted') {
        new Notification('Style Assistant 👗', {
          body: 'Was trägst du heute? Dein Outfit des Tages wartet!',
        })
      }
    }, 24 * 60 * 60 * 1000)
  }, msUntil8)
}
```

In `ProfilePage.tsx` einen Toggle hinzufügen:
- "Tägliche Outfit-Erinnerung (08:00 Uhr)" mit An/Aus-Switch
- Bei Aktivierung: `requestNotificationPermission()` + `scheduleOutfitReminder()`
- Status in `localStorage` unter `"notificationsEnabled"` speichern

---

**Abschluss-Test:**
1. `npm run dev` — keine TypeScript-Fehler
2. OutfitsPage zeigt Wetter-Widget mit Temperatur und Layer-Advice
3. Wochenkalender ist klappbar und ein Outfit lässt sich dem heutigen Tag zuweisen
4. HistoryPage zeigt getragene Outfits und 👍/👎 ändert die Bewertung
5. WardrobePage zeigt Shimmer-Skeleton beim Laden der Bilder
6. "Ähnliche Stücke"-Button liefert Thumbnails (CLIP muss im Backend laufen)
7. In Profil: Notification-Toggle fragt Browser-Permission
```

---

## Reihenfolge & Hinweise

- **Prompt 1** ist unabhängig, kann sofort gestartet werden.
- **Prompt 2** setzt Prompt 1 voraus (CORS-Env muss existieren, DB-Pfad geändert).
- **Prompt 3** setzt Prompt 2 voraus (neue API-Endpoints müssen laufen).
- Nach jedem Prompt: Docker-Container neu starten (`docker compose up --build`)
  oder lokalen Dev-Server prüfen.
- CLIP-Modell lädt beim ersten `/similar`-Aufruf ~300 MB — das ist normal.
