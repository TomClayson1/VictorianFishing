import { useState, useEffect, useCallback } from 'react'
import MapView from './components/MapView.jsx'
import BathymetryView from './components/BathymetryView.jsx'
import ControlPanel from './components/ControlPanel.jsx'
import PlanAheadPanel from './components/PlanAheadPanel.jsx'
import ConditionsBar from './components/ConditionsBar.jsx'
import CastLogDrawer from './components/CastLogDrawer.jsx'
import StartSessionSheet from './components/StartSessionSheet.jsx'
import ActiveSession from './components/ActiveSession.jsx'
import { loadLiveConditions } from './lib/liveConditions.js'
import { computeProbability, probToRGB } from './lib/probability.js'
import { useHotspots } from './lib/useHotspots.js'
import { startSession, endSession, logCatch } from './lib/sessionService.js'

const REFRESH_INTERVAL = 30 * 60 * 1000
const todayStr = new Date().toISOString().split('T')[0]

const FALLBACK_CONDITIONS = {
  species:  'gummy_shark',
  tide:     'flood_peak',
  month:    new Date().getMonth() + 1,
  tod:      new Date().getHours() * 60 + new Date().getMinutes(),
  baro:     'stable',
  hPa:      null,
  planDate: todayStr,
}

function computeStats(conditions, speciesMap) {
  const cfg = speciesMap?.[conditions.species]
  if (!cfg || !cfg.hotspots?.length) return { peak:0, avg:0, peakName:null }
  let peak = 0, peakName = null
  const sum = cfg.hotspots.reduce((acc, h) => {
    const p = computeProbability({ lat:h.lat, lng:h.lng, ...conditions })
    if (p > peak) { peak = p; peakName = h.name }
    return acc + p
  }, 0)
  return { peak, avg: sum / cfg.hotspots.length, peakName }
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const tabStyle = (active) => ({
  fontSize:'12px', padding:'6px 16px', border:'none',
  borderBottom: active ? '2px solid #2a6aad' : '2px solid transparent',
  background:'transparent',
  color: active ? 'white' : '#7db8e8',
  cursor:'pointer', fontWeight: active ? 500 : 400, transition:'all 0.15s',
})

const viewBtnStyle = (active) => ({
  fontSize:'12px', padding:'4px 12px', borderRadius:'6px',
  border:'1px solid', cursor:'pointer',
  borderColor: active ? '#2a6aad' : '#0f2444',
  background:  active ? 'rgba(42,106,173,0.3)' : 'transparent',
  color:        active ? 'white' : '#7db8e8',
})

export default function App() {
  const { species, loading: hotspotsLoading } = useHotspots()
  const [conditions,     setConditions]     = useState(FALLBACK_CONDITIONS)
  const [view,           setView]           = useState('2d')
  const [mode,           setMode]           = useState('live')
  const [loading,        setLoading]        = useState(true)
  const [lastRefresh,    setLastRefresh]    = useState(null)
  const [stats,          setStats]          = useState({ peak:0, avg:0, peakName:null })
  const [showStartSheet, setShowStartSheet] = useState(false)
  const [activeSession,  setActiveSession]  = useState(null)
  const [sessionCatches, setSessionCatches] = useState([])

  const refresh = useCallback(() => {
    loadLiveConditions()
      .then(live => {
        setConditions(prev => prev._mode === 'live' ? { ...prev, ...live } : prev)
        setLastRefresh(new Date())
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { refresh() }, [refresh])
  useEffect(() => { const id = setInterval(refresh, REFRESH_INTERVAL); return () => clearInterval(id) }, [refresh])
  useEffect(() => { setStats(computeStats(conditions, species)) }, [conditions, species])

  const handleModeSwitch = (newMode) => {
    setMode(newMode)
    if (newMode === 'live') {
      setLoading(true)
      loadLiveConditions()
        .then(live => { setConditions(prev => ({ ...prev, ...live, _mode:'live' })); setLoading(false) })
        .catch(() => setLoading(false))
    } else {
      setConditions(prev => ({ ...prev, planDate:todayStr, _mode:'plan' }))
    }
  }

  const handleStartSession = async (setup) => {
    try {
      const session = await startSession({ ...setup, conditions })
      setActiveSession(session)
      setSessionCatches([])
      setShowStartSheet(false)
    } catch (err) {
      console.error('Failed to start session:', err)
      alert('Could not start session — check Supabase connection')
    }
  }

  const handleLogCatch = async () => {
    if (!activeSession) return
    try {
      const catch_ = await logCatch({ sessionId:activeSession.id, species:activeSession.target_species, conditions, lat:activeSession.lat, lng:activeSession.lng })
      setSessionCatches(prev => [...prev, catch_])
    } catch (err) { console.error('Failed to log catch:', err) }
  }

  const handleEndSession = async () => {
    if (!activeSession) return
    try {
      await endSession(activeSession.id)
      setActiveSession(null)
      setSessionCatches([])
    } catch (err) { console.error('Failed to end session:', err) }
  }

  const cfg     = species?.[conditions.species]
  const seasonM = cfg?.seasonalIndex?.[conditions.month - 1] ?? 0
  const tideM   = cfg?.tideWeights?.[conditions.tide] ?? 0
  const [pr, pg, pb] = probToRGB(stats.peak)

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>

      {/* Header */}
      <div style={{ padding:'10px 16px', background:'#06111f', borderBottom:'1px solid #0f2444', display:'flex', alignItems:'center', gap:'12px' }}>
        <h1 style={{ fontSize:'15px', fontWeight:500, margin:0, color:'white', flex:1 }}>
          Victorian Fishing
        </h1>
        {lastRefresh && mode === 'live' && (
          <span style={{ fontSize:'10px', color:'#7db8e8', opacity:0.6 }}>
            Updated {lastRefresh.toLocaleTimeString('en-AU', { hour:'2-digit', minute:'2-digit' })}
          </span>
        )}
        <button style={viewBtnStyle(view === '2d')} onClick={() => setView('2d')}>2D map</button>
        <button style={viewBtnStyle(view === '3d')} onClick={() => setView('3d')}>3D bathymetry</button>
      </div>

      {/* Mode tabs */}
      <div style={{ display:'flex', alignItems:'flex-end', background:'#06111f', borderBottom:'1px solid #0f2444', padding:'0 16px', gap:'4px' }}>
        <button style={tabStyle(mode === 'live')} onClick={() => handleModeSwitch('live')}>● Live conditions</button>
        <button style={tabStyle(mode === 'plan')} onClick={() => handleModeSwitch('plan')}>◎ Plan ahead</button>
      </div>

      {/* Control panels */}
      {mode === 'live' ? (
        <>
          <ConditionsBar conditions={conditions} loading={loading} />
          <ControlPanel conditions={conditions} onChange={setConditions} species={species} />
        </>
      ) : (
        <PlanAheadPanel conditions={conditions} onChange={setConditions} species={species} />
      )}

      {/* Map */}
      <div style={{ flex:1, position:'relative' }}>
        <div style={{ position:'absolute', inset:0, display: view === '2d' ? 'block' : 'none' }}>
          <MapView conditions={conditions} species={species} />
        </div>
        <div style={{ position:'absolute', inset:0, display: view === '3d' ? 'block' : 'none' }}>
          <BathymetryView conditions={conditions} visible={view === '3d'} />
        </div>
      </div>

      {/* Best mark callout */}
      {stats.peakName && (
        <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 16px', background:'#06111f', borderTop:'1px solid #0f2444' }}>
          <span style={{ fontSize:'13px' }}>⭐</span>
          <span style={{ fontSize:'12px', color:'#7db8e8' }}>Best mark right now:</span>
          <span style={{ fontSize:'13px', fontWeight:500, color:'white' }}>{stats.peakName}</span>
          <span style={{ fontSize:'11px', fontWeight:600, color:`rgb(${pr},${pg},${pb})`, marginLeft:'auto' }}>
            {Math.round(stats.peak * 100)}%
          </span>
        </div>
      )}

      {/* Stats strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', borderTop:'1px solid #0f2444', background:'#06111f', flexShrink:0 }}>
        {[
          { label:'Peak probability',  value:`${Math.round(stats.peak*100)}%`,  color:`rgb(${pr},${pg},${pb})` },
          { label:'Avg across marks',  value:`${Math.round(stats.avg*100)}%`,   color:'#7db8e8' },
          { label:'Tide factor',       value:`×${tideM.toFixed(2)}`,            color: tideM>=0.85?'#4ddd99':tideM>=0.65?'#e8cc44':'#ff7055' },
          { label: mode==='plan' ? `Season — ${MONTH_NAMES[conditions.month-1]} (planned)` : `Season — ${MONTH_NAMES[conditions.month-1]} (now)`,
            value: seasonM.toFixed(2), color: seasonM>=0.8?'#4ddd99':seasonM>=0.5?'#e8cc44':'#ff7055' },
        ].map((s, i) => (
          <div key={i} style={{ textAlign:'center', padding:'8px 4px', borderRight: i<3 ? '1px solid #0f2444' : 'none' }}>
            <div style={{ fontSize:'16px', fontWeight:500, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:'10px', color:'#7db8e8', marginTop:'2px', textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* CastLog drawer */}
      <CastLogDrawer onStartSession={() => setShowStartSheet(true)} activeSession={activeSession} />

      {/* Start session sheet */}
      {showStartSheet && (
        <StartSessionSheet conditions={conditions} onStart={handleStartSession} onCancel={() => setShowStartSheet(false)} />
      )}

      {/* Active session overlay */}
      {activeSession && (
        <ActiveSession session={activeSession} catches={sessionCatches} conditions={conditions} onLogCatch={handleLogCatch} onEndSession={handleEndSession} />
      )}

    </div>
  )
}
