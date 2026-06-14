// Intent-Keyword-Datenbank — vollständig regelbasiert, kein LLM, kein externer Dienst.

export interface PhraseResult {
  occasion?: string | null
  formality_delta?: number
  formality_target?: number
  sprezzatura_mode?: boolean | null
  hard_excludes?: string[]
  hard_requires?: string[]
  emotion?: { mood: string; formality_hint: number }
  confidence?: number
  fallback_used?: boolean
}

// ── SEKTION 1: OCCASION_MAP ─────────────────────────────────────────────────

export const OCCASION_MAP: Array<{
  keywords: string[]
  occasion: string
  confidence: number
  formality_hint: number
}> = [

  // BÜRO / ARBEIT
  { confidence: 0.95, formality_hint: 65, occasion: 'office', keywords: [
    'büro','arbeit','arbeiten','job','office','work','meeting','termin',
    'besprechung','konferenz','präsentation','pitch','vorstellung',
    'geschäfts','geschäftlich','beruflich','kollegen','chef','vorgesetzter',
    'kunde','kunden','client','clients','interview','vorstellungsgespräch',
    'bewerbung','bewerbungsgespräch','dienstreise','business','beruf',
    'arbeitsplatz','firma','unternehmen','corporate','professional',
    'professionell','seriös','kompetent','verhandlung','verhandeln',
    'buero','praestation','geschaeftlich','vortrag','praesentation',
    'kundentermin','geschaeftsessen','arbeitsalltag','kollegin',
    'abteilung','konferenzraum','sitzungszimmer','bueroalltag',
  ]},

  // DINNER / ABEND-EVENT
  { confidence: 0.95, formality_hint: 72, occasion: 'event', keywords: [
    'dinner','abendessen','restaurant','ausgehen','abend',
    'abends','abendveranstaltung','gala','empfang','vernissage','theater',
    'oper','konzert','veranstaltung','event','feier','feiern','date',
    'dates','romantisch','romantisches','hochzeit','hochzeitsfeier',
    'taufe','kommunion','konfirmation','jubiläum','geburtstag','party',
    'geburtstagsparty','silvester','weihnachtsfeier','firmenevent',
    'afterwork','afterparty','cocktailparty','galaabend',
    'feierlicher','festlich','festlichkeit','abendgala','soiree',
    'essen gehen','ausgehen','abendessen','gastronomie','lokal',
    'veranstaltung','jubilaeum','geburtstagseier','familienfeier',
    'weihnachten','ostern','silvesterfeier','neujahr','jubileum',
    'feierlichkeit','galaveranstaltung','abendprogramm',
  ]},

  // FREIZEIT / CASUAL
  { confidence: 0.90, formality_hint: 35, occasion: 'leisure', keywords: [
    'freizeit','entspannen','entspannt','relaxed','relaxen','chillen',
    'chill','casual','lässig','locker','leger','bequem','normal',
    'alltag','alltäglich','spazieren','spaziergang','einkaufen','shoppen',
    'freunde','kumpels','buddies','zuhause','heimisch',
    'wochenende','weekend','samstag','sonntag','frei','freier',
    'kaffee','café','brunch','frühstück','mittagessen','lunch',
    'picknick','park','museum','ausstellung','kino','film',
    'nichts besonderes','ganz normal','ganz gewöhnlich','alltags',
    'normaler tag','entspannter tag','whatever','egal','irgendwas',
    'zocken','gaming','netflix','fernsehen','serie','spielen',
    'spazierengehen','joggen','entspannung','erholung','ruhe',
    'freunde treffen','kollegen treffen','casual friday','lässig',
    'chilltag','entspannungstag','freietag','pausentag','urlaubstag',
    'zuhausebleiben','homeday','laessig','freizeitlook',
  ]},

  // REISE / TRAVEL
  { confidence: 0.92, formality_hint: 45, occasion: 'travel', keywords: [
    'reise','reisen','trip','unterwegs','urlaub','holiday',
    'vacation','flug','fliegen','flughafen','airport','bahn','zug',
    'autofahrt','roadtrip','städtetrip','städtereise','kurztrip',
    'wochenendtrip','business trip','dienstreise','konferenzreise',
    'hotel','airbnb','packen','koffer','backpacking','interrail',
    'europa','ausland','fernreise','citybreak','sightseeing',
    'reisender','fluggast','passagier','transit','transfer',
    'city trip','tagesausflug','ausflug','touristik',
    'abflug','ankunft','boarding','gate','terminal',
  ]},

  // STRAND / SOMMER / OUTDOOR
  { confidence: 0.93, formality_hint: 20, occasion: 'beach', keywords: [
    'strand','beach','meer','see','pool','schwimmen','sommer','sonnig',
    'draußen','outdoor','terrasse','garten','grillabend','grillen','bbq',
    'mallorca','ibiza','mykonos','capri','riviera','monaco',
    'mittelmeer','atlantik','nordsee','bodensee','resort','yacht',
    'boot','segeln','sonnenterrasse','sommerfest','festival','open air',
    'badeort','badeurlaub','strandurlaub','strandbar','poolbar',
    'sommerwetter','hitzewelle','sonnenbaden','strandleben',
    'hafenpromenade','uferpromenade','strandpromenade','küste',
  ]},
]

// ── SEKTION 2: FORMALITY_MAP ─────────────────────────────────────────────────

export const FORMALITY_MAP: Array<{
  keywords: string[]
  delta: number
  target?: number
  sprezzatura?: boolean
}> = [

  // SEHR FORMAL (+25 bis +30)
  { delta: +28, keywords: [
    'sehr formal','hochformal','black tie','white tie','gala','smoking',
    'frack','super elegant','extrem schick','höchste stufe',
    'am formalsten','förmlichsten','offiziellsten',
    'sehr feierlich','hochoffiziell','strenge kleiderordnung',
    'dress code black tie','abendgarderobe','festgarderobe',
  ]},

  // FORMAL (+15 bis +24)
  { delta: +18, keywords: [
    'formal','formell','elegant','schick','gepflegt','distinguished',
    'smart','polished','kultiviert','stilvoll','niveauvoll',
    'anspruchsvoll','repräsentativ','repräsentieren',
    'guten eindruck','seriös wirken','professionell aussehen',
    'ernsthaft','würdevoll','dezent edel','dressy',
    'aufgetreten','angezogen','herausgeputzt','chic','chique',
    'formell gekleidet','smart dressed','well groomed',
    'klasse machen','klasse aussehen','gut aussehen',
  ]},

  // LEICHT FORMAL (+8 bis +14)
  { delta: +10, keywords: [
    'etwas schicker','ein bisschen schicker','halbwegs schick',
    'ordentlich','anständig','vorzeigbar','presentable',
    'nicht zu lässig','nicht zu locker','etwas gehobener',
    'ein tick formaler','aufgeräumt','sauber','gut gekleidet',
    'well dressed','put together','gepflegtes aussehen',
    'angemessen','passend gekleidet','dresscode','dress code',
    'ansprechend','representabel','representabel aussehen',
  ]},

  // NEUTRAL (0, explizit)
  { delta: 0, keywords: [
    'neutral','ausgeglichen','weder noch','irgendwas dazwischen',
    'mittelmäßig','durchschnittlich','standard','normal halt',
    'wie immer','wie üblich','wie sonst','ganz normal',
    'irgendwas','keine ahnung','keine vorstellung','beliebig',
  ]},

  // LEICHT CASUAL (-8 bis -14)
  { delta: -10, keywords: [
    'eher locker','ein bisschen lockerer','aufgelockert',
    'entspannter','luftiger','freier','weniger steif',
    'nicht so streng','laid back','laid-back',
    'no dress code','kein dresscode','kein zwang','zwanglos','ungezwungen',
    'unkompliziert','ohne viel aufwand','ohne stress',
    'relaxter look','lockerer look','freizügiger','freizügig',
    'soft look','weicher look','entspanntes outfit',
  ]},

  // CASUAL (-15 bis -24)
  { delta: -18, keywords: [
    'casual','lässig','locker','leger','entspannt','relaxed','chill',
    'chillig','easy','easy going','easygoing','bequem','comfy','gemütlich',
    'soft','wohlfühl','alltagstauglich','bodenständig',
    'down to earth','schlicht','simpel','simple','pragmatisch',
    'sportlich casual','athleisure','streetstyle','straßenstil',
    'alltagsoutfit','normaloutfit','freizeitkleidung','freizeitlook',
    'casual look','easy look','simple look','laessig','gemuetlich',
    'entspannter stil','lockerer stil','freizeitstil',
  ]},

  // SEHR CASUAL (-25 bis -30)
  { delta: -28, keywords: [
    'super lässig','sehr casual','mega locker','total entspannt',
    'so lässig wie möglich','maximale bequemlichkeit',
    'ultracasual','hypercasual','hyperlässig','hyperlocker',
    'couch ready','couch-ready','maximal bequem','maximalbequem',
    'so locker wie möglich','vollst entspannung','komplett locker',
    'total locker','super locker','extrem locker','mega casual',
  ]},

  // SPREZZATURA
  { delta: -8, sprezzatura: true, keywords: [
    'sprezzatura','lässige eleganz','elegant lässig','nonchalant',
    'effortless','mühelos','ohne mühe','ohne anstrengung',
    'locker elegant','elegant locker','leicht hingeworfen','casually chic',
    'chic casual','effortless style','effortless chic',
    'gepflegt lässig','lässig gepflegt','smart lässig',
    'insouciant','bella figura','arte di arrangiarsi',
  ]},
]

// ── SEKTION 3: STYLE_MAP ────────────────────────────────────────────────────

export const STYLE_MAP: Array<{
  keywords: string[]
  style: string
  boost: number
}> = [

  // OLD MONEY / QUIET LUXURY
  { style: 'old_money', boost: 20, keywords: [
    'old money','quiet luxury','understatement','diskret','dezent',
    'subtil','zurückhaltend','unauffällig','no logo','logoless',
    'kein logo','keine logos','kaschmir','cashmere','vicuña',
    'superfine','handgenäht','maßgeschneidert','bespoke','made to measure',
    'neapolitanisch','sartorial','gentleman','gentlemanlike',
    'altgeld','erbe','heritage','zeitlos','zeitlose','evergreen',
    'klassisch zeitlos','gediegen','noblesse','adel','adelsstil',
    'aristokratisch','wie ein lord','generationenreich','erbesstil',
    'erbstück','vererbte qualität','natürliche materialien','noble',
    'distinguished','wie ein millionär','quiet','quiet style',
    'no brand','brandless','logofrei','kein branding','understate',
  ]},

  // BRITISH COUNTRYSIDE
  { style: 'british_countryside', boost: 20, keywords: [
    'britisch','british','england','englisch','uk style','london look',
    'countryside','country','land','ländlich','tweed','harris tweed',
    'donegal','herringbone','fischgrät','kariert','plaid','tartankaro',
    'barbour','wachsjacke','waxed jacket','brogue','brogues',
    'jagd','reiten','pferde','equestrian','polo','cricket','rugby',
    'oxford','cambridge','posh','toff','landed gentry',
    'country gentleman','country house','landsitz','manor house',
    'lord','sir','equestrian style','eton','harrow',
    'shooting jacket','norfolk jacket','cord','kord','corduroy',
    'moleskin','shetland','fair isle','arran',
    'alt england','englische tradition','britische tradition',
    'english countryside','british style',
    'british heritage','british classic','brit look','brit style',
    'rugged','workwear','heritage workwear','americana','american heritage',
    'lumberjack','holzfäller','denim','selvedge denim','raw denim',
    'goodyear','rahmengenäht','work boots','schwere boots','vibram',
    'maskulin','robust','widerstandsfähig','langlebig',
    'utility','utilitarian','heritage look','authentisch',
  ]},

  // IVY LEAGUE / PREPPY
  { style: 'ivy_league', boost: 20, keywords: [
    'ivy','ivy league','preppy','prep','preppig','college','campus',
    'uni','universität','harvard','yale','princeton','dartmouth',
    'amerikanisch klassisch','american classic','american style',
    'new england','chino','khaki','penny loafer','loafer',
    'ocbd','oxford cloth','buttondown','button down',
    'repp stripe','club tie','argyle','madras','seersucker',
    'tennis','golf','segeln','rudern','lacrosse','regatta',
    'yacht club','country club','clubby','collegiate','academic',
    'studentisch','campus look','east coast','east coast style',
    'nantucket','cape cod','ralph lauren','j crew',
    'brooks brothers','crew neck','varsity','letterman',
    'blazer mit patch','patches','sport chic','sportellegant',
  ]},

  // ENGLISH GENTLEMAN
  { style: 'italian_elegance', boost: 20, keywords: [
    'italienisch','italian','neapolitan','neapel','mailand','milano','milan',
    'sprezzatura','agnelli','cucinelli','pitti','fresco','spalla camicia',
    'tobacco','suede','wildleder','strickpolo','knit polo','unstrukturiert',
    'aperitivo','soft tailoring','drape',
  ]},
  { style: 'english_gentleman', boost: 20, keywords: [
    'business formal','anzug','suit','dressed up',
    'krawatte','tie','einstecktuch','pocket square','french cuff',
    'manschettenknöpfe','cufflinks','haifischkragen',
    'dreiteilig','drei teile','weste zum anzug','double breasted','zweireiher',
    'banker','anwalt','richter','arzt','doktor','direktor','vorstand','ceo',
    'formelles meeting','wichtiges meeting','aufsichtsrat','hauptversammlung',
    'gerichtstermin','gericht','notartermin',
    'vollständiger anzug','komplettanzug','anzugpflicht','formeller anzug',
    'savile row','bespoke suit','maßanzug','geschneiderter anzug',
  ]},

  // SMART CASUAL (includes former business_casual territory)
  { style: 'smart_casual', boost: 18, keywords: [
    'smart casual','polished casual','dressed down','schick aber locker',
    'modern','zeitgemäß','aktuell','up to date','hip','angesagt',
    'urban','city look','stadt','städtisch','metropolitan',
    'minimal','minimalistisch','clean','cleaner look','schlicht schick',
    'capsule wardrobe','elevated basics','quality casual',
    'selvedge','premium basics','functional chic',
    'no nonsense','functional','funktional','practical chic',
    'normcore','normaler stil','alltäglich schick','alltagseleganz',
    'moderner stil','aktueller look','zeitgemäßer stil',
    'business casual','smart casual office','büro locker','büro entspannt',
    'kein anzugzwang','sakko ohne krawatte','blazer casual',
    'modernes büro','startup','creative office','kreativbüro',
    'tech office','coworking','pitch meeting','investor meeting',
    'casual friday','after work','afterwork look',
    'halb büro halb freizeit','professionell aber locker',
  ]},

  // RIVIERA / SUMMER
  { style: 'riviera', boost: 20, keywords: [
    'riviera','côte d\'azur','french riviera','capri','portofino',
    'amalfi','positano','santorini','mykonos','ibiza','mallorca',
    'monaco','nizza','nice','cannes','saint tropez','antibes',
    'sommerlich','sommer','leinen','linen','leicht','luftig',
    'mediterranean','mediterran','italienisch','italian style',
    'la dolce vita','dolce vita','bella figura',
    'aperitivo','aperol','yacht','segelboot','kutter',
    'weiß','hellblau','creme','sand','leinenlook',
    'barfuß schick','sockless','no socks','loafer ohne socken',
    'offen','aufgeknöpft','ärmel hochgekrempelt','sommereleganz',
    'strandeleganz','küsteneleganz','hafenblick','meeresluft',
  ]},

]

// ── SEKTION 4: WEATHER_MAP ──────────────────────────────────────────────────

export const WEATHER_MAP: Array<{
  keywords: string[]
  temp_override?: number
  rain_mode?: boolean
  season_hint?: 'winter' | 'spring' | 'summer' | 'autumn'
}> = [
  { temp_override: -5, season_hint: 'winter', keywords: [
    'eiskalt','eisig','gefroren','frost','schnee','schneesturm',
    'blizzard','arktisch','arktische kälte','winterkälte',
    'bitter cold','freezing','tiefgefroren','extremkälte',
    'minus grade','tief unter null','polarkälte',
  ]},
  { temp_override: 3, season_hint: 'winter', keywords: [
    'sehr kalt','richtig kalt','kalt','kalt draußen','winterlich',
    'winter','januar kälte','dezember kälte','februar kälte',
    'unter null','frostig','kälteeinbruch','kaltfront',
    'richtig kalt draußen','bitterkalt','sibirisch kalt',
  ]},
  { temp_override: 10, season_hint: 'autumn', keywords: [
    'kühl','kuehl','kühler','kuehler','kaelter','kälter','kalt werden',
    'frisch','ein bisschen kalt','herbstlich',
    'herbst','october','november','spätherbst',
    'chilly','crisp','invigorating','brisk','herbstwetter',
    'herbstlich kühl','herbstliche kühle','kühleres wetter',
    'leichte kühle','frische luft','kühler wind','etwas kälter',
    'etwas kühl','bissl kalt','bissl kühl','bisserl kalt',
  ]},
  { temp_override: 16, season_hint: 'spring', keywords: [
    'mild','angenehm','frühling','frühlingsartig','april wetter',
    'wechselhaft','übergangszeit','layering weather',
    'nicht kalt nicht warm','temperiert','moderat',
    'frühlingshaft','frühlingsluft','frühlingswetter',
    'maerz','april','maerzkälte','frühlingsbeginn',
    'erwärmung','aufwärmen','wenns etwas kühler ist',
  ]},
  { temp_override: 22, season_hint: 'summer', keywords: [
    'warm','angenehm warm','sommerlich','schönes wetter','sonnig',
    'sonne','gutes wetter','schöner tag','perfektes wetter',
    't-shirt wetter','kurze ärmel wetter','shirtsleeves',
    'warmwetter','sommerwetter','sonnenwetter','schoenewetter',
  ]},
  { temp_override: 28, season_hint: 'summer', keywords: [
    'heiß','sehr warm','sehr heiß','brütend heiß','hitze','hochsommer',
    'hitzewelle','schwitzen','schwitze','tropical','tropisch',
    'heat wave','scorching','glühend','heiss','heisse',
    'knallt die sonne','richtig heiß','brüllend heiß',
  ]},
  { temp_override: 35, season_hint: 'summer', keywords: [
    'extreme hitze','unerträgliche hitze','übertrieben heiß',
    'mega heiß','so heiß','bullenhitze','sahara','wüste',
    'inferno','feueröfen','40 grad','afrikanisch heiß',
  ]},
  { rain_mode: true, keywords: [
    'regen','regnet','regnerisch','nass','feucht','schauer','gewitter',
    'gewittert','sprühregen','nieselregen','platzregen','wolkenbruch',
    'starkregen','regenwetter','schlechtes wetter','trüb','bewölkt',
    'rainy','wet','drizzle','drizzling','shower','storm','stormy',
    'overcast','grau draußen','beschissen wetter',
    'wetterfest','wasserdicht','nicht nass werden',
    'regenschirm','regenmantel','nass werden','nasswetter',
  ]},
]

// ── SEKTION 5: EMOTION_MAP ──────────────────────────────────────────────────

export const EMOTION_MAP: Array<{
  keywords: string[]
  mood: 'confident' | 'relaxed' | 'nervous' | 'bold' | 'subtle' | 'festive'
  formality_hint: number
}> = [
  { mood: 'confident', formality_hint: +12, keywords: [
    'selbstbewusst','selbstsicher','stark','power','kraft','dominant',
    'beeindrucken','eindruck machen','überzeugen','überwältigen',
    'confidence','confident','assertive','commanding','presence',
    'ausstrahlung','charisma','charismatisch','authority','autorität',
    'mutig','gewagt','bold','statement','ich will glänzen',
    'alle augen','heads will turn','kopfdrehen','präsenz zeigen',
    'überzeugend','durchsetzungsstark','durchsetzungskraft',
    'durchsetzend','anführer','fuehrung','leadership',
  ]},
  { mood: 'relaxed', formality_hint: -12, keywords: [
    'entspannt','entspannter tag','kein stress','stressfrei',
    'chillig','ruhig','gelassen','carefree','unbesorgt',
    'laid back','no pressure','no stress','chill day','lazy day',
    'fauler tag','gemütlicher tag','slow day','entspannter abend',
    'ich will mich wohlfühlen','komfort','bequemlichkeit',
    'sorglos','entspannungsmodus','relaxmodus','ruhiger tag',
    'keinen stress','entspannt durch den tag','easy day',
  ]},
  { mood: 'nervous', formality_hint: +8, keywords: [
    'nervös','aufgeregt','wichtiger tag','wichtiges gespräch',
    'entscheidend','entscheidender moment','viel zu verlieren',
    'ersten eindruck','first impression','erstes mal',
    'neue arbeit','neuer job','erster arbeitstag','kennenlernen',
    'erste begegnung','nervosität','lampenfieber','aufregung',
    'ich will nichts falsch machen','auf nummer sicher',
    'nichts falsch machen wollen','absichern','sicher gehen',
    'no risk','auf der sicheren seite','vorsichtig sein',
  ]},
  { mood: 'bold', formality_hint: +5, keywords: [
    'außergewöhnlich','außerordentlich','extravagant',
    'kreativ','künstlerisch','experimentell','unkonventionell','edgy',
    'avant garde','avant-garde','fashion forward','fashionable',
    'trendy','trend','im trend','modern fashion','high fashion',
    'ich will auffallen','anders sein','herausstechen','statement machen',
    'bold choice','riskant','risk','risikobereit','fashion risk',
    'mutig sein','gewagt','kreativ sein','anders aussehen',
    'ausgefallen','aussergewoehnlich','auffallen wollen',
  ]},
  { mood: 'subtle', formality_hint: -5, keywords: [
    'dezent','zurückhaltend','unaufdringlich','unauffällig','bescheiden',
    'minimalistisch','schlicht','simple','einfach','nicht zu viel',
    'nicht zu wenig','ausgewogen','balanced','understated',
    'im hintergrund bleiben','nicht im mittelpunkt','low key','lowkey',
    'no fuss','unfussy','mühelos','ohne aufwand',
    'ruhig bleiben','nicht auffallen','bescheidener look',
    'zurückhaltend gekleidet','unauffälliger look',
  ]},
  { mood: 'festive', formality_hint: +15, keywords: [
    'festlich','feierlich','festlichkeit','fest','feier','feiern',
    'celebration','celebrate','celebratory','jubilate','jubilieren',
    'besonderer anlass','special occasion','memorable','unvergesslich',
    'einmal im leben','seltener anlass','groß feiern','grosse feier',
    'glänzen','strahlen','shine','glow','glamour','glamourös',
    'glitzy','glittering','dazzle','dazzling','strahlend',
    'feierstimmung','partylaune','hochgestimmt','ausgelassen',
  ]},
]

// ── SEKTION 6: EXCLUDE_MAP ──────────────────────────────────────────────────

export const EXCLUDE_MAP: Array<{
  keywords: string[]
  excludes: string[]
}> = [
  { excludes: ['krawatte','einstecktuch'], keywords: [
    'keine krawatte','ohne krawatte','krawattenfrei','tie free','no tie',
    'bloß keine krawatte','krawatte weglassen','kein schlips','schlipslos',
    'krawattenlos','bitte keine krawatte','krawatte vergessen',
  ]},
  { excludes: ['sakko','blazer'], keywords: [
    'kein sakko','ohne sakko','kein blazer','ohne blazer','jacket free',
    'no jacket','bloß kein sakko','sakko weglassen','sakkolos',
    'kein jacket','ohne jacket','bitte kein sakko','jacketless',
  ]},
  { excludes: ['oxford_schuh','derby','brogue'], keywords: [
    'keine lederschuhe','keine geschlossenen schuhe','keine formalen schuhe',
    'keine formschuhe','keine büroschuhe','keine eleganten schuhe',
    'ohne lederschuhe','ohne formschuhe',
  ]},
  { excludes: ['sneaker_minimal'], keywords: [
    'keine sneaker','ohne sneaker','keine turnschuhe','no sneakers',
    'kein sportschuh','kein freizeitschuh','sneakerfrei','ohne turnschuhe',
  ]},
  { excludes: ['jeans_dunkel'], keywords: [
    'keine jeans','ohne jeans','jeansfrei','no jeans','kein denim',
    'ohne denim','denim free','jeans weglassen','bitte keine jeans',
  ]},
  { excludes: ['anzughose'], keywords: [
    'keine anzughose','keine formelle hose','keine businesshose',
    'kein anzug','no suit pants','anzughosenlos','kein anzugstoff',
  ]},
]

// ── SEKTION 7: REQUIRE_MAP ──────────────────────────────────────────────────

export const REQUIRE_MAP: Array<{
  keywords: string[]
  requires: string[]
}> = [
  { requires: ['krawatte'], keywords: [
    'mit krawatte','krawatte tragen','krawatte pflicht','tie required',
    'krawatte muss sein','krawatte heute','unbedingt krawatte',
    'bitte krawatte','krawatte anziehen','muss krawatte sein',
  ]},
  { requires: ['sakko','blazer'], keywords: [
    'mit sakko','sakko tragen','mit blazer','blazer muss','jacket required',
    'sakko muss sein','unbedingt sakko','sakko heute',
    'bitte sakko','mit dem sakko','sakko anziehen',
  ]},
  { requires: ['rollkragen'], keywords: [
    'rollkragen','turtleneck','mit rollkragen','rollkragen heute',
    'rollkragenpulli','turtleneck sweater','rollkragen bitte',
  ]},
  { requires: ['loafer','penny_loafer'], keywords: [
    'loafer','mit loafer','loafer heute','penny loafer','ohne socken',
    'no socks','sockless look','sockenfrei','sockless',
  ]},
  { requires: ['boots','chelsea_boot'], keywords: [
    'mit boots','boots heute','stiefel','ankle boots','chelsea boots',
    'mit stiefeln','bootsday','stiefel bitte','mit chelsea boots',
  ]},
]

// ── SEKTION 8: PHRASE_MAP (Multi-Word) ─────────────────────────────────────

export const PHRASE_MAP: Array<{
  phrase: string    // normalized (lowercase, umlauts: ae/oe/ue/ss, no punct)
  result: PhraseResult
}> = [
  // Formalitäts-Phrasen
  { phrase: 'nicht zu steif',           result: { formality_delta: -12, sprezzatura_mode: true }},
  { phrase: 'nicht zu foermlich',       result: { formality_delta: -15 }},
  { phrase: 'nicht zu formal',          result: { formality_delta: -15 }},
  { phrase: 'nicht zu schick',          result: { formality_delta: -10 }},
  { phrase: 'nicht zu laessig',         result: { formality_delta: +10 }},
  { phrase: 'nicht zu locker',          result: { formality_delta: +10 }},
  { phrase: 'nicht zu casual',          result: { formality_delta: +10 }},
  { phrase: 'nicht zu overdressed',     result: { formality_delta: -12 }},
  { phrase: 'nicht zu underdressed',    result: { formality_delta: +12 }},
  // Kontrast-Phrasen
  { phrase: 'elegant aber entspannt',   result: { formality_delta: +5, sprezzatura_mode: true }},
  { phrase: 'elegant aber locker',      result: { formality_delta: +5, sprezzatura_mode: true }},
  { phrase: 'elegant aber bequem',      result: { formality_delta: +5, sprezzatura_mode: true }},
  { phrase: 'schick aber bequem',       result: { formality_delta: +8, sprezzatura_mode: true }},
  { phrase: 'schick aber nicht overdressed', result: { formality_delta: +8 }},
  { phrase: 'casual aber schick',       result: { formality_delta: -5, sprezzatura_mode: true }},
  { phrase: 'casual aber gepflegt',     result: { formality_delta: -5 }},
  { phrase: 'locker aber anstaendig',   result: { formality_delta: -8 }},
  { phrase: 'lässig aber gepflegt',     result: { formality_delta: -8, sprezzatura_mode: true }},
  { phrase: 'laessig aber gepflegt',    result: { formality_delta: -8, sprezzatura_mode: true }},
  { phrase: 'gepflegt aber locker',     result: { formality_delta: +3, sprezzatura_mode: true }},
  { phrase: 'formal aber bequem',       result: { formality_delta: +8, sprezzatura_mode: true }},
  { phrase: 'smart aber casual',        result: { formality_delta: 0,  sprezzatura_mode: true }},
  // Soziale Situationen
  { phrase: 'guten eindruck machen',    result: { formality_delta: +15, emotion: { mood: 'confident', formality_hint: 12 }}},
  { phrase: 'guten eindruck hinterlassen', result: { formality_delta: +15, emotion: { mood: 'confident', formality_hint: 12 }}},
  // Anlass-Phrasen
  { phrase: 'nichts besonderes',        result: { formality_delta: 0, occasion: 'leisure' }},
  { phrase: 'nix besonderes',           result: { formality_delta: 0, occasion: 'leisure' }},
  { phrase: 'wie immer',                result: { formality_delta: 0 }},
  { phrase: 'ganz normal',              result: { formality_delta: 0, occasion: 'leisure' }},
  { phrase: 'mach mir etwas aus',       result: { fallback_used: false }},
  { phrase: 'ueberrasch mich',          result: { fallback_used: false }},
  { phrase: 'whatever du denkst',       result: { fallback_used: false }},
  { phrase: 'surprise me',             result: { fallback_used: false }},
  // Unsicherheits-Phrasen
  { phrase: 'bin mir nicht sicher',     result: { confidence: 0.3 }},
  { phrase: 'weiss nicht genau',        result: { confidence: 0.3 }},
  { phrase: 'keine ahnung was ich tragen soll', result: { confidence: 0.2, fallback_used: true }},
  { phrase: 'hab keine ahnung',         result: { confidence: 0.2 }},
  { phrase: 'keine idee was ich anziehen soll', result: { confidence: 0.2, fallback_used: true }},
  // Ausschluss-Phrasen
  { phrase: 'bloss keine krawatte',     result: { hard_excludes: ['krawatte','einstecktuch'] }},
  { phrase: 'bloß keine krawatte',      result: { hard_excludes: ['krawatte','einstecktuch'] }},
  { phrase: 'bitte keine krawatte',     result: { hard_excludes: ['krawatte','einstecktuch'] }},
  { phrase: 'bloss kein sakko',         result: { hard_excludes: ['sakko','blazer'] }},
  { phrase: 'bloß kein sakko',          result: { hard_excludes: ['sakko','blazer'] }},
  { phrase: 'bitte kein sakko',         result: { hard_excludes: ['sakko','blazer'] }},
  // Risikovermeidung
  { phrase: 'auf nummer sicher',        result: { formality_delta: +8, emotion: { mood: 'nervous', formality_hint: 8 }}},
  { phrase: 'sicher gehen',             result: { formality_delta: +5, emotion: { mood: 'nervous', formality_hint: 5 }}},
  // Overdressed / Underdressed
  { phrase: 'will nicht overdressed sein',   result: { formality_delta: -12 }},
  { phrase: 'nicht overdressed wirken',      result: { formality_delta: -12 }},
  { phrase: 'will nicht underdressed sein',  result: { formality_delta: +12 }},
  { phrase: 'nicht underdressed wirken',     result: { formality_delta: +12 }},
  // Erlaubnisse
  { phrase: 'macht nichts wenn schick',      result: { formality_delta: +8 }},
  { phrase: 'darf ruhig schick sein',        result: { formality_delta: +10 }},
  { phrase: 'gerne auch schicker',           result: { formality_delta: +10 }},
  { phrase: 'darf auch eleganter sein',      result: { formality_delta: +12 }},
  // Stil-Phrasen
  { phrase: 'old money look',                result: {} },
  { phrase: 'quiet luxury',                  result: {} },
  { phrase: 'no dress code',                 result: { formality_delta: -10 }},
  { phrase: 'kein dresscode',                result: { formality_delta: -10 }},
  { phrase: 'kein dress code',               result: { formality_delta: -10 }},
]

// ── SEKTION 9: REFERENCE_MAP ─────────────────────────────────────────────────

export const REFERENCE_MAP: Array<{
  keywords: string[]
  flag: string
}> = [
  { flag: 'use_last_outfit', keywords: [
    'wie neulich','wie das letzte mal','wie vorhin','wie vorgestern',
    'wie gestern','ähnlich wie neulich','ähnlich wie zuletzt',
    'mein letztes outfit','was ich zuletzt hatte','wie beim letzten mal',
    'das von neulich','letzte woche','vorige woche','zuletzt',
  ]},
  { flag: 'use_favorite', keywords: [
    'lieblingsoutfit','mein lieblings','wie mein favorit',
    'das was ich am liebsten trage','mein go-to look','mein standard',
    'meinen favoriten','was mir am besten gefällt','am liebsten',
    'mein liebling','mein lieblingsoutfit','favorit',
  ]},
  { flag: 'use_highest_scored', keywords: [
    'bestes outfit','das beste','top rated',
    'was du am besten findest','was du empfiehlst','deine empfehlung',
    'was hältst du für am besten','was passt am besten',
    'dein vorschlag','empfiehl mir','was würdest du empfehlen',
    'bestes ergebnis','höchste bewertung',
  ]},
]
