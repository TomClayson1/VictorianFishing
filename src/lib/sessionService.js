import { supabase } from './supabase.js'

export async function startSession({ locationName, lat, lng, targetSpecies, baitRig, notes, conditions }) {
  const { data, error } = await supabase
    .from('fishing_sessions')
    .insert({
      started_at:      new Date().toISOString(),
      location_name:   locationName,
      lat, lng,
      target_species:  targetSpecies,
      bait_rig:        baitRig,
      notes:           notes ?? null,
      tide_state:      conditions.tide         ?? null,
      baro_trend:      conditions.baro         ?? null,
      hpa:             conditions.hPa          ?? null,
      wind_speed_kts:  conditions.windSpeedKts ?? null,
      wind_dir_deg:    conditions.windDirDeg   ?? null,
      wind_dir_label:  conditions.windDirLabel ?? null,
      humidity_pct:    conditions.humidity     ?? null,
      cloud_cover_pct: conditions.cloudCover   ?? null,
      air_temp_c:      conditions.airTemp      ?? null,
      moon_phase:      conditions.moonPhase    ?? null,
      moon_label:      conditions.moonLabel    ?? null,
      catch_count:     0,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function logCatch({ sessionId, species, conditions, lat, lng }) {
  const { data, error } = await supabase
    .from('session_catches')
    .insert({
      session_id:     sessionId,
      caught_at:      new Date().toISOString(),
      species,
      tide_state:     conditions.tide         ?? null,
      baro_trend:     conditions.baro         ?? null,
      hpa:            conditions.hPa          ?? null,
      wind_speed_kts: conditions.windSpeedKts ?? null,
      wind_dir_deg:   conditions.windDirDeg   ?? null,
      moon_phase:     conditions.moonPhase    ?? null,
      tod_minutes:    conditions.tod          ?? null,
      lat, lng,
    })
    .select()
    .single()
  if (error) throw error

  await supabase.rpc('increment_catch_count', { session_id: sessionId })
  return data
}

export async function endSession(sessionId) {
  const { data, error } = await supabase
    .from('fishing_sessions')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', sessionId)
    .select()
    .single()
  if (error) throw error
  return data
}
