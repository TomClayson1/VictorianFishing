const KNOWN_NEW_MOON = new Date('2000-01-06T18:14:00Z').getTime()
const SYNODIC_DAYS  = 29.53059

export function getMoonPhase(date = new Date()) {
  const elapsed = date.getTime() - KNOWN_NEW_MOON
  const days    = elapsed / (1000 * 60 * 60 * 24)
  const phase   = ((days % SYNODIC_DAYS) + SYNODIC_DAYS) % SYNODIC_DAYS
  return phase / SYNODIC_DAYS
}

export function getMoonLabel(phase) {
  if (phase < 0.03 || phase > 0.97) return 'New moon'
  if (phase < 0.22)                 return 'Waxing crescent'
  if (phase < 0.28)                 return 'First quarter'
  if (phase < 0.47)                 return 'Waxing gibbous'
  if (phase < 0.53)                 return 'Full moon'
  if (phase < 0.72)                 return 'Waning gibbous'
  if (phase < 0.78)                 return 'Last quarter'
  return                                   'Waning crescent'
}

export function getMoonEmoji(phase) {
  if (phase < 0.03 || phase > 0.97) return '🌑'
  if (phase < 0.22)                 return '🌒'
  if (phase < 0.28)                 return '🌓'
  if (phase < 0.47)                 return '🌔'
  if (phase < 0.53)                 return '🌕'
  if (phase < 0.72)                 return '🌖'
  if (phase < 0.78)                 return '🌗'
  return                                   '🌘'
}

export function moonMultiplier(phase, pref = 'any') {
  const fromNew  = Math.min(phase, 1 - phase)
  const fromFull = Math.abs(phase - 0.5)
  const tidalBoost = 1 - Math.min(fromNew, fromFull) * 1.2
  if (pref === 'new')  return 0.75 + (1 - fromNew  * 2) * 0.35
  if (pref === 'full') return 0.75 + (1 - fromFull * 2) * 0.35
  return 0.80 + tidalBoost * 0.20
}
