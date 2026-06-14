// Direct Open-Meteo call from browser (no API key needed) — port of backend/app/services/weather.py

const TEMP_HISTORY_KEY = 'temp_history'

/** Feature 5: Logs today's temperature once per day into localStorage (max 30 entries). */
export function dailyTempLog(temp: number): void {
  try {
    const history: Array<{ date: string; temp: number }> = JSON.parse(
      localStorage.getItem(TEMP_HISTORY_KEY) ?? '[]',
    )
    const today = new Date().toISOString().slice(0, 10)
    if (!history.some(e => e.date === today)) {
      history.push({ date: today, temp })
      while (history.length > 30) history.shift()
      localStorage.setItem(TEMP_HISTORY_KEY, JSON.stringify(history))
    }
  } catch {}
}

export function tempToSeason(temp: number): string {
  if (temp < 5)  return 'winter'
  if (temp < 12) return 'autumn'
  if (temp < 20) return 'spring'
  return 'summer'
}

/**
 * Blueprint v2.0 Phase 6: Layering-Mode bei Übergangstemperaturen (15–18°C).
 * Erkennt ob Layering (leichte + schwere Items kombiniert) empfohlen wird.
 */
export function isLayeringMode(temp: number): boolean {
  return temp >= 15 && temp < 18
}

/**
 * Blueprint v2.0 Phase 6: Regenpriorität ab 60% Niederschlagswahrscheinlichkeit.
 */
export function needsRainPriority(precipProb: number): boolean {
  return precipProb >= 60
}

function tempToLayerAdvice(temp: number): string {
  if (temp < 5)  return 'Schwerer Mantel, Schal, wärmende Schichten'
  if (temp < 12) return 'Jacke oder leichter Mantel empfohlen'
  if (temp >= 15 && temp < 18) return 'Layering empfohlen — leichte Jacke oder Cardigan kombinieren'
  if (temp < 18) return 'Leichte Jacke oder Cardigan passt'
  if (temp < 24) return 'Kein Outerwear nötig'
  return 'Leichte, luftige Kleidung — es ist warm'
}

export async function getWeather(lat = 53.5753, lon = 10.0153) {
  const params = new URLSearchParams({
    latitude:  String(lat),
    longitude: String(lon),
    current:   'temperature_2m,weathercode,windspeed_10m,precipitation',
    forecast_days: '1',
    timezone: 'auto',
  })

  const resp = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
  if (!resp.ok) throw new Error('Weather API error')
  const data = await resp.json()

  const current = data.current ?? {}
  const temp  = current.temperature_2m ?? 15
  const wcode = current.weathercode ?? 0
  const wind  = current.windspeed_10m ?? 0
  const precip = current.precipitation ?? 0

  const season = tempToSeason(temp)

  let desc = 'Wechselhaft'
  if (wcode === 0)                        desc = 'Klarer Himmel'
  else if (wcode <= 3)                    desc = 'Teils bewölkt'
  else if (wcode >= 45 && wcode <= 57)    desc = 'Neblig'
  else if (wcode >= 61 && wcode <= 67)    desc = 'Regen'
  else if (wcode >= 71 && wcode <= 77)    desc = 'Schnee'
  else if (wcode >= 80 && wcode <= 82)    desc = 'Schauer'
  else if (wcode >= 95 && wcode <= 99)    desc = 'Gewitter'

  const needsUmbrella = precip > 0.5 || (wcode >= 61 && wcode <= 82)

  dailyTempLog(Math.round(temp * 10) / 10)

  return {
    temperature_c: Math.round(temp * 10) / 10,
    description: desc,
    wind_kmh: Math.round(wind * 10) / 10,
    precipitation_mm: Math.round(precip * 100) / 100,
    season,
    layer_advice: tempToLayerAdvice(temp),
    needs_umbrella: needsUmbrella,
    weather_code: wcode,
    // Blueprint v2.0 Phase 6
    layering_mode: isLayeringMode(temp),
    rain_priority: needsRainPriority(needsUmbrella ? 80 : 0),
  }
}
