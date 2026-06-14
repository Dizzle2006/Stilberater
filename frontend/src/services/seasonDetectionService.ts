export type SeasonShift = 'summer_to_autumn' | 'winter_to_spring'

const TEMP_HISTORY_KEY  = 'temp_history'
const LAST_CHECK_KEY    = 'last_season_check_at'
const SNOOZE_KEY        = 'snooze_until_at'

function avgTempSlice(
  history: Array<{ date: string; temp: number }>,
  daysOffset: number,
  daysWindow: number,
): number | null {
  const now   = Date.now()
  const toMs  = now - daysOffset * 86400000
  const fromMs = toMs - daysWindow * 86400000
  const slice  = history.filter(e => {
    const t = new Date(e.date).getTime()
    return t >= fromMs && t < toMs
  })
  if (!slice.length) return null
  return slice.reduce((s, e) => s + e.temp, 0) / slice.length
}

export function analyzeTempTrend(): {
  recent: number | null
  previous: number | null
} {
  try {
    const history: Array<{ date: string; temp: number }> = JSON.parse(
      localStorage.getItem(TEMP_HISTORY_KEY) ?? '[]',
    )
    return {
      recent:   avgTempSlice(history, 0,  14),
      previous: avgTempSlice(history, 14, 14),
    }
  } catch {
    return { recent: null, previous: null }
  }
}

export function detectSeasonShift(): SeasonShift | null {
  const { recent, previous } = analyzeTempTrend()
  if (recent === null || previous === null) return null
  if (recent < 12 && previous > 18) return 'summer_to_autumn'
  if (recent > 18 && previous < 12) return 'winter_to_spring'
  return null
}

/**
 * Call once per app start. Returns null if already checked today or snoozed.
 * Stores last check date in localStorage to avoid re-checking intraday.
 */
export function checkSeasonShift(): SeasonShift | null {
  try {
    const now   = new Date()
    const today = now.toISOString().slice(0, 10)

    if (localStorage.getItem(LAST_CHECK_KEY) === today) return null
    localStorage.setItem(LAST_CHECK_KEY, today)

    const snoozeUntil = localStorage.getItem(SNOOZE_KEY)
    if (snoozeUntil && new Date(snoozeUntil) > now) return null

    return detectSeasonShift()
  } catch {
    return null
  }
}

/** Hides the banner for 7 days. */
export function snoozeSeasonBanner(): void {
  try {
    localStorage.setItem(
      SNOOZE_KEY,
      new Date(Date.now() + 7 * 86400000).toISOString(),
    )
  } catch {}
}
