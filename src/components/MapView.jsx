import { useEffect, useRef, useCallback } from 'react'
import L from 'leaflet'
import { VIC_BOUNDS, TILE_LAYERS } from '../data/constants.js'
import { computeProbability, probToRGB } from '../lib/probability.js'

const HEAT_W = 300
const HEAT_H = 220

function buildHeatCanvas(conditions, bounds) {
  const canvas = document.createElement('canvas')
  canvas.width = HEAT_W; canvas.height = HEAT_H
  const ctx = canvas.getContext('2d')
  const imgData = ctx.createImageData(HEAT_W, HEAT_H)
  const minLat = bounds.getSouth(), maxLat = bounds.getNorth()
  const minLng = bounds.getWest(),  maxLng = bounds.getEast()

  for (let px = 0; px < HEAT_W; px++) {
    for (let py = 0; py < HEAT_H; py++) {
      const lng = minLng + (px / HEAT_W) * (maxLng - minLng)
      const lat = maxLat - (py / HEAT_H) * (maxLat - minLat)
      const p = computeProbability({ lat, lng, ...conditions })
      const [r, g, b] = probToRGB(p)
      const alpha = Math.round((0.08 + p * 0.70) * 255)
      const idx = (py * HEAT_W + px) * 4
      imgData.data[idx] = r; imgData.data[idx+1] = g
      imgData.data[idx+2] = b; imgData.data[idx+3] = alpha
    }
  }
  ctx.putImageData(imgData, 0, 0)
  return canvas.toDataURL()
}

export default function MapView({ conditions, species }) {
  const mapContainerRef = useRef(null)
  const mapRef          = useRef(null)
  const heatLayerRef    = useRef(null)
  const markerLayerRef  = useRef(null)

  const renderHeat = useCallback((map, cond) => {
    if (heatLayerRef.current) map.removeLayer(heatLayerRef.current)
    const bounds = map.getBounds()
    heatLayerRef.current = L.imageOverlay(buildHeatCanvas(cond, bounds), bounds, {
      opacity:1, interactive:false, zIndex:300,
    })
    heatLayerRef.current.addTo(map)
  }, [])

  const renderMarkers = useCallback((map, cond, speciesMap) => {
    if (markerLayerRef.current) markerLayerRef.current.clearLayers()
    else markerLayerRef.current = L.layerGroup().addTo(map)

    const cfg = speciesMap?.[cond.species]
    if (!cfg) return

    const scored = cfg.hotspots.map(h => ({
      ...h, prob: computeProbability({ lat:h.lat, lng:h.lng, ...cond }),
    }))
    const peakProb = Math.max(...scored.map(s => s.prob))

    scored.forEach(h => {
      const [r,g,b] = probToRGB(h.prob)
      const pct   = Math.round(h.prob * 100)
      const color = `rgb(${r},${g},${b})`
      const isPeak = h.prob === peakProb && peakProb > 0

      const icon = L.divIcon({
        className: '',
        html: isPeak ? `
          <div style="position:relative;width:28px;height:28px;display:flex;align-items:center;justify-content:center;">
            <div style="position:absolute;width:28px;height:28px;border-radius:50%;background:${color};opacity:0.25;animation:pulseRing 1.8s ease-out infinite;"></div>
            <div style="width:13px;height:13px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 8px ${color};z-index:2;"></div>
            <div style="position:absolute;top:-18px;left:50%;transform:translateX(-50%);font-size:10px;font-weight:700;color:white;background:rgba(6,17,31,0.85);padding:1px 5px;border-radius:8px;white-space:nowrap;border:1px solid ${color};">${pct}%</div>
          </div>` : `
          <div style="position:relative;width:18px;height:18px;display:flex;align-items:center;justify-content:center;">
            <div style="width:10px;height:10px;border-radius:50%;background:${color};border:1.5px solid rgba(255,255,255,0.8);box-shadow:0 0 4px ${color};"></div>
            <div style="position:absolute;top:-15px;left:50%;transform:translateX(-50%);font-size:9px;font-weight:600;color:rgba(255,255,255,0.85);background:rgba(6,17,31,0.7);padding:0 4px;border-radius:6px;white-space:nowrap;">${pct}%</div>
          </div>`,
        iconSize:   isPeak ? [28,28] : [18,18],
        iconAnchor: isPeak ? [14,14] : [9,9],
      })

      L.marker([h.lat, h.lng], { icon, zIndexOffset: isPeak ? 1000 : 0 })
        .bindTooltip(`<strong>${h.name}</strong>${isPeak ? ' ⭐ best right now' : ''}<br/>${pct}% probability<br/><span style="color:#aaa;font-size:11px">${h.region?.replace('_',' ') ?? ''}</span>`,
          { className:'fishing-tip', direction:'top', offset:[0, isPeak ? -16 : -10] })
        .addTo(markerLayerRef.current)
    })
  }, [])

  useEffect(() => {
    if (mapRef.current) return
    const map = L.map(mapContainerRef.current, { center:VIC_BOUNDS.center, zoom:VIC_BOUNDS.zoom })
    const esriLayer = L.tileLayer(TILE_LAYERS.esriOcean.url, { attribution:TILE_LAYERS.esriOcean.attribution, maxZoom:TILE_LAYERS.esriOcean.maxZoom })
    esriLayer.addTo(map)
    const osmLayer = L.tileLayer(TILE_LAYERS.osm.url, { attribution:TILE_LAYERS.osm.attribution, maxZoom:TILE_LAYERS.osm.maxZoom })
    L.control.layers({ 'Ocean chart':esriLayer, 'Street map':osmLayer }, {}, { position:'topright' }).addTo(map)
    L.control.scale({ imperial:false }).addTo(map)
    mapRef.current = map
    map.on('moveend', () => { renderHeat(map, mapRef.current._lastConditions) })
    return () => { map.remove(); mapRef.current = null }
  }, [renderHeat])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map._lastConditions = conditions
    const id = setTimeout(() => { renderHeat(map, conditions); renderMarkers(map, conditions, species) }, 50)
    return () => clearTimeout(id)
  }, [conditions, species, renderHeat, renderMarkers])

  return (
    <div ref={mapContainerRef} style={{ width:'100%', height:'100%' }}>
      <style>{`
        .fishing-tip { background:rgba(6,17,31,0.92); border:1px solid rgba(255,255,255,0.15); border-radius:6px; color:white; font-size:12px; padding:5px 9px; }
        .fishing-tip::before { display:none; }
        @keyframes pulseRing { 0%{transform:scale(0.6);opacity:0.5} 70%{transform:scale(1.6);opacity:0} 100%{transform:scale(1.6);opacity:0} }
      `}</style>
    </div>
  )
}
