import { useState, useEffect } from 'react'
import { SPECIES } from '../data/hotspots.js'
import { formatTime } from '../lib/probability.js'
import { tideDescription } from '../lib/liveConditions.js'

const s = {
  bar:       { position:'fixed', bottom:0, left:0, right:0, zIndex:1500, background:'#0a1a30', borderTop:'2px solid #2a6aad' },
  header:    { display:'flex', alignItems:'center', padding:'10px 16px', gap:'10px', cursor:'pointer' },
  dot:       { width:'8px', height:'8px', borderRadius:'50%', background:'#00cc66', boxShadow:'0 0 6px #00cc66', flexShrink:0 },
  info:      { flex:1 },
  name:      { fontSize:'13px', fontWeight:600, color:'white' },
  sub:       { fontSize:'11px', color:'#7db8e8', marginTop:'1px' },
  badge:     { fontSize:'13px', fontWeight:600, color:'#4ddd99', background:'rgba(0,180,80,0.15)', border:'1px solid rgba(0,180,80,0.3)', padding:'3px 10px', borderRadius:'10px' },
  body:      { padding:'0 16px 32px', borderTop:'1px solid #0f2444' },
  condRow:   { display:'flex', gap:'8px', padding:'10px 0', borderBottom:'1px solid #0f2444', flexWrap:'wrap' },
  pill:      { fontSize:'11px', color:'#7db8e8', background:'#06111f', border:'1px solid #0f2444', padding:'3px 10px', borderRadius:'8px' },
  logBtn:    { width:'100%', padding:'18px', background:'linear-gradient(135deg,#1a5c2a,#2a8c44)', border:'none', borderRadius:'12px', color:'white', fontSize:'20px', fontWeight:700, cursor:'pointer', marginTop:'12px', minHeight:'60px', boxShadow:'0 4px 16px rgba(0,180,80,0.3)' },
  endBtn:    { width:'100%', padding:'14px', background:'transparent', border:'1px solid #8b2020', borderRadius:'12px', color:'#ff7055', fontSize:'15px', cursor:'pointer', marginTop:'8px' },
  listTitle: { fontSize:'10px', color:'#7db8e8', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'6px', marginTop:'12px' },
  catchItem: { display:'flex', alignItems:'center', gap:'8px', padding:'6px 0', borderBottom:'1px solid #0a1a30', fontSize:'13px', color:'white' },
  catchDot:  { width:'8px', height:'8px', borderRadius:'50%', flexShrink:0 },
}

function elapsed(startedAt) {
  const secs = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
  const h = Math.floor(secs/3600), m = Math.floor((secs%3600)/60), sec = secs%60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${sec}s`
  return `${sec}s`
}

export default function ActiveSession({ session, catches, conditions, onLogCatch, onEndSession }) {
  const [expanded,   setExpanded]   = useState(true)
  const [elapsedStr, setElapsedStr] = useState('')
  const [logging,    setLogging]    = useState(false)

  useEffect(() => {
    const id = setInterval(() => setElapsedStr(elapsed(session.started_at)), 1000)
    setElapsedStr(elapsed(session.started_at))
    return () => clearInterval(id)
  }, [session.started_at])

  const cfg   = SPECIES[session.target_species]
  const color = cfg?.color ?? '#4a9eff'

  const handleLog = async () => { setLogging(true); await onLogCatch(); setLogging(false) }

  return (
    <div style={s.bar}>
      <style>{`@keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      <div style={s.header} onClick={() => setExpanded(e => !e)}>
        <div style={{ ...s.dot, animation:'livePulse 2s infinite' }} />
        <div style={s.info}>
          <div style={s.name}>{session.location_name}</div>
          <div style={s.sub}>{cfg?.label} · {session.bait_rig} · {elapsedStr}</div>
        </div>
        <div style={s.badge}>{catches.length} {catches.length === 1 ? 'catch' : 'catches'}</div>
        <span style={{ color:'#7db8e8', fontSize:'12px', marginLeft:'4px' }}>{expanded ? '▼' : '▲'}</span>
      </div>

      {expanded && (
        <div style={s.body}>
          <div style={s.condRow}>
            <span style={s.pill}>🕐 {formatTime(conditions.tod)}</span>
            <span style={s.pill}>🌊 {tideDescription(conditions.tide)}</span>
            {conditions.hPa          && <span style={s.pill}>⬆ {conditions.hPa} hPa</span>}
            {conditions.windSpeedKts && <span style={s.pill}>💨 {conditions.windSpeedKts}kts {conditions.windDirLabel}</span>}
            {conditions.moonEmoji    && <span style={s.pill}>{conditions.moonEmoji} {conditions.moonLabel}</span>}
          </div>

          <button style={s.logBtn} onClick={handleLog} disabled={logging}>
            {logging ? '…' : `🐟 Log ${cfg?.label ?? 'catch'}`}
          </button>

          {catches.length > 0 && (
            <>
              <div style={s.listTitle}>Catches this session</div>
              {[...catches].reverse().map((c, i) => (
                <div key={c.id ?? i} style={s.catchItem}>
                  <div style={{ ...s.catchDot, background: color }} />
                  <span style={{ color:'#7db8e8', minWidth:'44px' }}>
                    {new Date(c.caught_at).toLocaleTimeString('en-AU', { hour:'2-digit', minute:'2-digit' })}
                  </span>
                  <span>{SPECIES[c.species]?.label ?? c.species}</span>
                  <span style={{ color:'#7db8e8', fontSize:'11px', marginLeft:'auto' }}>
                    {tideDescription(c.tide_state)}
                  </span>
                </div>
              ))}
            </>
          )}

          <button style={s.endBtn} onClick={onEndSession}>End session</button>
        </div>
      )}
    </div>
  )
}
