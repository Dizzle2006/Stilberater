export const STRINGS = {
  // Gap 2 — Feedback Reasons
  feedbackReasons: {
    too_formal:     'Zu formal',
    wrong_color:    'Falsche Farbe',
    wrong_occasion: 'Falscher Anlass',
    style_mismatch: 'Stil passt nicht',
  },

  // Gap 3 — Rebalancing Banner
  rebalancing: {
    bannerTitle:   'Dein Stil entwickelt sich',
    bannerSubtitle:'Sollen wir dein Profil basierend auf deinem Feedback anpassen?',
    confirmBtn:    'Ja, anpassen',
    laterBtn:      'Später',
    applied:       'Profil wurde angepasst ✦',
  },

  // Feature 1 — Calendar Integration
  calendar: {
    fromCalendar:   'Aus Kalender',
    chipHint: (title: string) => `Aus Kalender: ${title.slice(0, 20)}${title.length > 20 ? '…' : ''}`,
    connectBtn:     'Kalender verbinden',
    connectedLabel: 'Kalender verbunden',
    disconnectBtn:  'Trennen',
  },

  // Feature 3 — Morning Briefing
  notifications: {
    morningToggleLabel: 'Täglicher Look-Vorschlag',
    morningToggleDesc: 'Outfit-Vorschlag jeden Morgen als Benachrichtigung',
    notifTimeLabel: 'Uhrzeit',
    permissionDenied: 'Benachrichtigungen wurden abgelehnt.',
    briefingTitle: 'Dein Look für heute',
    briefingBodyFallback: 'Wetter unbekannt — wähle selbst',
    briefingFormat: (top: string, bottom: string, shoe: string, score: number) =>
      `Heute: ${top} + ${bottom} + ${shoe} — Score ${score}`,
  },

  // Feature 4 — Wear Tracking
  wear: {
    markWornBtn: 'Heute getragen',
    autoFavToast: 'Outfit zum Favoriten gemacht — du trägst es gerne!',
    lastWornToday: 'Heute',
    lastWornDaysAgo: (n: number) => `Vor ${n} ${n === 1 ? 'Tag' : 'Tagen'}`,
    lastWornWeeksAgo: (n: number) => `Vor ${n} ${n === 1 ? 'Woche' : 'Wochen'}`,
    lastWornLabel: 'Zuletzt getragen',
    lastWornPrefix: 'Zuletzt:',
  },

  // Hybrid-System — Hybrid-Stil-Erkennung
  hybrid: {
    screenTitle: 'Dein Stil liegt zwischen zwei Welten',
    acceptBtn: 'Beide Stilrichtungen aufnehmen',
    rejectBtn: 'Nur Hauptstil behalten',
    exampleCombosTitle: 'Typische Outfits für diesen Stil',
    detectedLabel: 'Erkannter Hybrid-Stil',
  },

  // Assistent — Intent-Parser + Bild-Stil-Boards
  assistant: {
    tabText:            'Beschreiben',
    tabImage:           'Bild hochladen',
    placeholder:        'Was möchtest du heute tragen?',
    submitBtn:          'Outfits zeigen',
    detectedLabel:      'Erkannt',
    occasionLabel:      'Anlass',
    formalityLabel:     'Formalität',
    styleLabel:         'Stile',
    confidenceLabel:    'Konfidenz',
    boardSelectorTitle: 'Welchen Stil suchst du?',
    boardSelectBtn:     'Diese Outfits zeigen',
    imageHint:          'Bild als Inspiration hochladen',
    pickBoardHint:      'Welcher Stil trifft das am besten?',
    intentBanner:       (occasion: string | null) =>
      occasion ? `Outfit für: ${occasion}` : 'Persönlicher Stil-Filter aktiv',
    resetFilter:        'Filter zurücksetzen',
  },

  // Feature 5 — Season Detection
  season: {
    bannerSummerToAutumn: 'Herbst zieht ein — Sommer-Items pausieren?',
    bannerWinterToSpring: 'Frühling kommt — Winteritems wegräumen?',
    adjustNow: 'Jetzt anpassen',
    remindLater: 'Später erinnern',
    pauseScreenTitle: 'Saisonale Items pausieren',
    pauseBtn: 'Pausieren',
    reactivateAll: 'Alle wieder aktivieren',
    pauseSuccess: (n: number) => `${n} Items pausiert`,
    reactivateSuccess: (n: number) => `${n} Items wieder aktiv`,
  },
}
