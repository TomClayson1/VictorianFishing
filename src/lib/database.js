import { supabase } from './supabase.js'

export async function fetchSpeciesConfigs() {
  const { data, error } = await supabase
    .from('species_config')
    .select('*')
    .eq('active', true)
    .order('common_name')
  if (error) { console.error('[DB] fetchSpeciesConfigs:', error.message); return null }
  return data
}

export async function fetchAllHotspots() {
  const { data, error } = await supabase
    .from('hotspots')
    .select('*')
    .order('strength', { ascending: false })
  if (error) { console.error('[DB] fetchAllHotspots:', error.message); return null }
  return data
}

export async function fetchRecentSessions(limit = 30) {
  const { data, error } = await supabase
    .from('fishing_sessions')
    .select('id,started_at,ended_at,location_name,lat,lng,target_species,bait_rig,notes,catch_count,tide_state,wind_speed_kts,wind_dir_label,moon_label,hpa')
    .order('started_at', { ascending: false })
    .limit(limit)
  if (error) { console.error('[DB] fetchRecentSessions:', error.message); return [] }
  return data ?? []
}

export async function fetchSessionCatches(sessionId) {
  const { data, error } = await supabase
    .from('session_catches')
    .select('*')
    .eq('session_id', sessionId)
    .order('caught_at', { ascending: true })
  if (error) { console.error('[DB] fetchSessionCatches:', error.message); return [] }
  return data ?? []
}
