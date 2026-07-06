import { SPECIES } from '../data/hotspots.js'
import { moonMultiplier } from './moonPhase.js'

const BARO_MULTIPLIERS = {
  rising_fast: 0.50, rising_slow: 0.75, stable: 0.90,
  falling_slow: 1.00, falling_fast: 0.65,
}

export function todMultiplier(tod) {
  const h = tod / 60
  if (h < 4  || h >= 22) return 0.70
  if (h < 6)             return 0.85
  if (h < 8)             return 1.00
  if (h < 11)            return 0.75
  if (h < 14)            return 0.45
  if (h < 17)            return 0.55
  if (h < 19.5)          return 0.95
  return 0.75
}

export function windMultiplier(windSpeedKts, maxKts = 20) {
  if (!windSpeedKts) return 0.85
  if (windSpeedKts <= 8) return 1.00
  if (windSpeedKts <= maxKts) return 1.0 - ((windSpeedKts - 8) / (maxKts - 8)) * 0.25
  return Math.max(0.30, 0.75 - ((windSpeedKts - maxKts) / 15) * 0.45)
}

export function cloudMultiplier(cloudPct) {
  if (cloudPct == null) return 0.90
  if (cloudPct < 20)   return 0.85
  if (cloudPct < 50)   return 0.95
  if (cloudPct < 80)   return 1.00
  return 0.95
}

function hotspotInfluence(lat, lng, hotspot) {
  const sigma = 0.009
  const dlat = lat - hotspot.lat
  const dlng = lng - hotspot.lng
  return hotspot.strength * Math.exp(-(dlat*dlat + dlng*dlng) / sigma)
}

export function computeProbability({
  lat, lng,
  species = 'gummy_shark',
  tide, month, tod, baro,
  windSpeedKts, cloudCover, moonPhase,
  hotspots: overrideHotspots,
}) {
  const cfg = SPECIES[species]
  if (!cfg) return 0

  const spots = overrideHotspots || cfg.hotspots
  let base = 0
  spots.forEach(h => {
    const inf = hotspotInfluence(lat, lng, h)
    if (inf > base) base = inf
  })
  base = Math.min(1, base)

  const tideM   = cfg.tideWeights[tide]        ?? 0.65
  const seasonM = cfg.seasonalIndex[month - 1] ?? 0.50
  const todM    = todMultiplier(tod)
  const baroM   = BARO_MULTIPLIERS[baro]       ?? 0.85
  const windM   = windMultiplier(windSpeedKts, cfg.windMaxKts ?? 20)
  const cloudM  = cloudMultiplier(cloudCover)
  const moonM   = moonPhase != null ? moonMultiplier(moonPhase, cfg.moonPref ?? 'any') : 0.90

  return Math.min(1, base * tideM * seasonM * todM * baroM * windM * cloudM * moonM)
}

export function probToRGB(p) {
  const stops = [
    [0.00,[10,26,80]], [0.25,[0,80,180]], [0.50,[0,170,80]],
    [0.75,[215,185,0]], [1.00,[255,50,0]],
  ]
  p = Math.max(0, Math.min(1, p))
  for (let i = 1; i < stops.length; i++) {
    if (p <= stops[i][0]) {
      const t = (p - stops[i-1][0]) / (stops[i][0] - stops[i-1][0])
      const a = stops[i-1][1], b = stops[i][1]
      return [
        Math.round(a[0]+t*(b[0]-a[0])),
        Math.round(a[1]+t*(b[1]-a[1])),
        Math.round(a[2]+t*(b[2]-a[2])),
      ]
    }
  }
  return [255,50,0]
}

export function formatTime(tod) {
  const h = Math.floor(tod / 60).toString().padStart(2, '0')
  const m = (tod % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}

export const BARO_OPTIONS = [
  { value:'rising_fast',  label:'Rising fast' },
  { value:'rising_slow',  label:'Rising slowly' },
  { value:'stable',       label:'Stable' },
  { value:'falling_slow', label:'Falling slowly' },
  { value:'falling_fast', label:'Falling fast' },
]
