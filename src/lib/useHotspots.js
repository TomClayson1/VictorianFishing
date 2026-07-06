import { useState, useEffect } from 'react'
import { fetchSpeciesConfigs, fetchAllHotspots } from './database.js'
import { SPECIES as LOCAL_SPECIES } from '../data/hotspots.js'

function buildSpeciesMap(speciesRows, hotspotRows) {
  const map = {}
  speciesRows.forEach(s => {
    map[s.slug] = {
      label:         s.common_name,
      color:         s.color_hex,
      seasonalIndex: s.seasonal_index,
      tideWeights:   s.tide_weights,
      windMaxKts:    s.wind_max_kts,
      moonPref:      s.moon_pref,
      hotspots:      [],
    }
  })
  hotspotRows.forEach(h => {
    if (map[h.species_slug]) {
      map[h.species_slug].hotspots.push({
        name:       h.name,
        lat:        parseFloat(h.lat),
        lng:        parseFloat(h.lng),
        strength:   parseFloat(h.strength),
        region:     h.region,
        depthM:     h.depth_m,
        bottomType: h.bottom_type,
      })
    }
  })
  return map
}

export function useHotspots() {
  const [species, setSpecies] = useState(LOCAL_SPECIES)
  const [loading, setLoading] = useState(true)
  const [source,  setSource]  = useState('local')

  useEffect(() => {
    async function load() {
      try {
        const [speciesRows, hotspotRows] = await Promise.all([
          fetchSpeciesConfigs(),
          fetchAllHotspots(),
        ])
        if (speciesRows && hotspotRows && speciesRows.length > 0) {
          setSpecies(buildSpeciesMap(speciesRows, hotspotRows))
          setSource('database')
          console.log(`[Hotspots] Loaded from Supabase — ${speciesRows.length} species, ${hotspotRows.length} hotspots`)
        } else {
          console.log('[Hotspots] Using local fallback data')
          setSource('local')
        }
      } catch (err) {
        console.warn('[Hotspots] DB load failed, using local:', err.message)
        setSource('local')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return { species, loading, source }
}
