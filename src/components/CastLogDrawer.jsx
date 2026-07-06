import { useState, useEffect } from 'react'
import { fetchRecentSessions } from '../lib/database.js'
import { SPECIES } from '../data/hotspots.js'

const s = {
  drawer:   { background:'#06111f', borderTop:'1px solid #0f2444' },
  header:   { display:'flex', alignItems:'center', padding:'10px 16px', cursor:'pointer', gap:'8px' },
  title:    { fontSize:'13px', fontWeight:500, color:'white', flex:1 },
  count:    { fontSize:'11px', color:'#7db8e8', background:'#0a1a30', border:'1px solid #0f2444', padding:'1px 8px', borderRadius:'10px' },
  startBtn: { margin:'12px 16px', width:'calc(100% - 32px)', padding:'14px', background:'#2a6aad', border:'none', borderRadius:'10px', color:'white', fontSize:'15px', fontWeight:600, cursor:'pointer' },
  session:  { padding:'10px 16px', borderTop:'1px solid #0a1a30', display:'flex', alignItems:'center', gap:'10px' },
  dot:      { width:'8px', height:'8px', borderRadius:'50%', flexShrink:0 },
  info:     { flex:1 },
  name:     { fontSize:'13px', color:'white', fontWeight:500 },
  sub:      { fontSize:'11px', color:'#7db8e8', marginTop:'2px' },
  catches:  { fontSize:'12px', fontWeight:500, color:'#4ddd99' },
  empty:    { padding:'20px 16px', textAlign:'center', fontSize:'13px', color:'#7db8e8', opacity:0.6 },
}

function formatDate(iso) {
  const d = new Date(iso), today = new Date(), yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-AU', { weekday:'short', day:'numeric', month:'short' })
}

function formatDuration(start, end) {
  if (!end) return 'In progress'
  const mins = Math.round((new Date(end) - new Date(start)) / 60000)
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins/60)}h ${mins%60}m`
}

export default function CastLogDrawer({ onStartSession, activeSession }) {
  const [open,     setOpen]     = useState(false)
  const [sessions, setSessions] = useState([])
  const [loading,  setLoading]  = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetchRecentSessions().then(setSessions).catch(console.error).finally(() => setLoading(false))
  }, [open])

  useEffect(() => {
    if (!activeSession) fetchRecentSessions().then(setSessions).catch(console.error)
  }, [activeSession])

  return (
    <div style={s.drawer}>
      <div style={s.header} onClick={() => setOpen(o => !o)}>
        <span style={{ fontSize:'15px' }}>📒</span>
        <span style={s.title}>CastLog</span>
        {sessions.length > 0 && <span style={s.count}>{sessions.length} sessions</span>}
        <span style={{ fontSize:'12px', color:'#7db8e8', transition:'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>▼</span>
      </div>
      {open && (
        <div>
          {!activeSession && (
            <button style={s.startBtn} onClick={onStartSession}>🎣 Start new session</button>
          )}
          {loading && <div style={s.empty}>Loading sessions…</div>}
          {!loading && sessions.length === 0 && (
            <div style={s.empty}>No sessions yet — start your first one above</div>
          )}
          {sessions.map(session => {
            const cfg = SPECIES[session.target_species]
            return (
              <div key={session.id} style={s.session}>
                <div style={{ ...s.dot, background: cfg?.color ?? '#4a9eff' }} />
                <div style={s.info}>
                  <div style={s.name}>{session.location_name}</div>
                  <div style={s.sub}>
                    {formatDate(session.started_at)} · {cfg?.label ?? session.target_species} · {formatDuration(session.started_at, session.ended_at)} · {session.bait_rig}
                  </div>
                </div>
                <div style={s.catches}>{session.catch_count ?? 0} 🐟</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
