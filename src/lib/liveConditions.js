import { getMoonPhase, getMoonLabel, getMoonEmoji } from './moonPhase.js'

const WP_LAT = -38.365
const WP_LNG = 145.222

// ── Tidal harmonics (Stony Point) ─────────────────────────────
const CONSTITUENTS = [
  { amp:0.542, phase:198.2, speed:28.9841 },
  { amp:0.108, phase:228.6, speed:30.0000 },
  { amp:0.108, phase:178.4, speed:28.4397 },
  { amp:0.062, phase:152.3, speed:15.0411 },
  { amp:0.048, phase:118.6, speed:13.9430 },
  { amp:0.038, phase:312.1, speed:57.9682 },
  { amp:0.024, phase:340.5, speed:58.9841 },
]
const MEAN_WATER_LEVEL = 0.84
const EPOCH = new Date('2000-01-01T00:00:00Z').getTime()

function toRad(deg) { return deg * Math.PI / 180 }

export function tideHeight(date) {
  const h = (date.getTime() - EPOCH) / 3600000
  let height = MEAN_WATER_LEVEL
  CONSTITUENTS.forEach(c => { height += c.amp * Math.cos(toRad(c.speed * h - c.phase)) })
  return Math.max(0, height)
}

export function getTideState(date = new Date()) {
  const samples = []
  for (let m = -120; m <= 120; m += 10) {
    samples.push({ height: tideHeight(new Date(date.getTime() + m * 60000)) })
  }
  const current = tideHeight(date)
  const max = Math.max(...samples.map(s => s.height))
  const min = Math.min(...samples.map(s => s.height))
  const range = max - min
  const rel = range > 0.1 ? (current - min) / range : 0.5
  const past   = tideHeight(new Date(date.getTime() - 20 * 60000))
  const future = tideHeight(new Date(date.getTime() + 20 * 60000))
  const rising = future > past
  if (rel > 0.85)              return 'high'
  if (rel < 0.15)              return 'low'
  if (rising  && rel < 0.45)  return 'flood_early'
  if (rising  && rel >= 0.45) return 'flood_peak'
  if (!rising && rel > 0.55)  return 'ebb_early'
  return 'ebb_peak'
}

export function tideDescription(state) {
  return {
    flood_early: 'Rising — early flood',
    flood_peak:  'Rising — peak flood',
    high:        'High water slack',
    ebb_early:   'Falling — early ebb',
    ebb_peak:    'Falling — peak ebb',
    low:         'Low water slack',
  }[state] ?? state
}

export function degreesToCompass(deg) {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW']
  return dirs[Math.round(deg / 22.5) % 16]
}

export function msToKnots(ms) { return Math.round(ms * 1.94384) }

// ── Weather cache ─────────────────────────────────────────────
let weatherCache = null
let weatherFetchedAt = null
const CACHE_TTL = 30 * 60 * 1000

async function fetchWeatherForecast(lat = WP_LAT, lng = WP_LNG) {
  const now = Date.now()
  if (weatherCache && weatherFetchedAt && (now - weatherFetchedAt) < CACHE_TTL) return weatherCache

  const params = [
    `latitude=${lat}`, `longitude=${lng}`,
    'hourly=surface_pressure,wind_speed_10m,wind_direction_10m,relative_humidity_2m,cloud_cover,precipitation,temperature_2m',
    'forecast_days=7', 'timezone=Australia%2FMelbourne', 'wind_speed_unit=ms',
  ].join('&')

  const res  = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
  const data = await res.json()

  const indexed = {}
  data.hourly.time.forEach((t, i) => {
    indexed[t] = {
      hpa:          data.hourly.surface_pressure[i],
      windSpeedMs:  data.hourly.wind_speed_10m[i],
      windDirDeg:   data.hourly.wind_direction_10m[i],
      humidity:     data.hourly.relative_humidity_2m[i],
      cloudCover:   data.hourly.cloud_cover[i],
      precipitation:data.hourly.precipitation[i],
      airTemp:      data.hourly.temperature_2m[i],
    }
  })

  weatherCache = { indexed, times: data.hourly.time, pressures: data.hourly.surface_pressure }
  weatherFetchedAt = now
  return weatherCache
}

function calcBaroTrend(pressures, times, targetTime) {
  const idx = times.findIndex(t => new Date(t) >= targetTime)
  if (idx < 0) return 'stable'
  const diff = pressures[idx] - pressures[Math.max(0, idx - 3)]
  if      (diff >  1.5) return 'rising_fast'
  else if (diff >  0.5) return 'rising_slow'
  else if (diff < -1.5) return 'falling_fast'
  else if (diff < -0.5) return 'falling_slow'
  return 'stable'
}

export async function getWeatherAt(date = new Date(), lat = WP_LAT, lng = WP_LNG) {
  const cache = await fetchWeatherForecast(lat, lng)
  const key = Object.keys(cache.indexed).find(k => k.startsWith(
    `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}T${String(date.getHours()).padStart(2,'0')}`
  ))
  const w = key ? cache.indexed[key] : null
  if (!w) return null

  return {
    hpa:          Math.round(w.hpa),
    baro:         calcBaroTrend(cache.pressures, cache.times, date),
    windSpeedKts: msToKnots(w.windSpeedMs ?? 0),
    windDirDeg:   w.windDirDeg,
    windDirLabel: degreesToCompass(w.windDirDeg ?? 0),
    humidity:     w.humidity,
    cloudCover:   w.cloudCover,
    airTemp:      w.airTemp,
    precipitation:w.precipitation,
  }
}

export function currentTod()   { const n = new Date(); return n.getHours() * 60 + n.getMinutes() }
export function currentMonth() { return new Date().getMonth() + 1 }

export async function loadLiveConditions() {
  const now     = new Date()
  const weather = await getWeatherAt(now)
  const tide    = getTideState(now)
  const moon    = getMoonPhase(now)

  return {
    tod:          currentTod(),
    month:        currentMonth(),
    tide,
    tideLabel:    tideDescription(tide),
    baro:         weather?.baro         ?? 'stable',
    hPa:          weather?.hpa          ?? null,
    windSpeedKts: weather?.windSpeedKts ?? null,
    windDirDeg:   weather?.windDirDeg   ?? null,
    windDirLabel: weather?.windDirLabel ?? null,
    humidity:     weather?.humidity     ?? null,
    cloudCover:   weather?.cloudCover   ?? null,
    airTemp:      weather?.airTemp      ?? null,
    moonPhase:    moon,
    moonLabel:    getMoonLabel(moon),
    moonEmoji:    getMoonEmoji(moon),
    planDate:     now.toISOString().split('T')[0],
  }
}

export async function loadConditionsForDateTime(date) {
  const weather = await getWeatherAt(date)
  const tide    = getTideState(date)
  const moon    = getMoonPhase(date)

  return {
    tod:          date.getHours() * 60 + date.getMinutes(),
    month:        date.getMonth() + 1,
    tide,
    tideLabel:    tideDescription(tide),
    baro:         weather?.baro         ?? 'stable',
    hPa:          weather?.hpa          ?? null,
    windSpeedKts: weather?.windSpeedKts ?? null,
    windDirDeg:   weather?.windDirDeg   ?? null,
    windDirLabel: weather?.windDirLabel ?? null,
    humidity:     weather?.humidity     ?? null,
    cloudCover:   weather?.cloudCover   ?? null,
    airTemp:      weather?.airTemp      ?? null,
    moonPhase:    moon,
    moonLabel:    getMoonLabel(moon),
    moonEmoji:    getMoonEmoji(moon),
  }
}
