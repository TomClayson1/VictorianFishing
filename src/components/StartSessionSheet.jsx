import { useState } from 'react'
import { SPECIES } from '../data/hotspots.js'
import { useLocation } from '../lib/useLocation.js'

const BAIT_OPTIONS = ['Pilchard fillet','Squid','Salmon fillet','Squid tentacle','Whitebait','Soft plastic','Hard body lure','Fly','Other']

const s = {
  overlay:   { position:'fixed', inset:0, zIndex:2000, background:'rgba(4,13,26,0.85)', display:'flex', alignItems:'flex-end', backdropFilter:'blur(4px)' },
  sheet:     { width:'100%', background:'#0a1a30', borderTop:'1px solid #0f2444', borderRadius:'16px 16px 0 0', padding:'20px 20px 40px', maxHeight:'90vh', overflowY:'auto' },
  handle:    { width:'36px', height:'4px', background:'#0f2444', borderRadius:'2px', margin:'0 auto 20px' },
  title:     { fontSize:'17px', fontWeight:600, color:'white', marginBottom:'20px', textAlign:'center' },
  field:     { marginBottom:'16px' },
  label:     { fontSize:'11px', fontWeight:500, color:'#7db8e8', textTransform:'uppercase', letterSpacing:'0.08em', display:'block', marginBottom:'6px' },
  input:     { width:'100%', background:'#06111f', border:'1px solid #0f2444', borderRadius:'8px', color:'white', fontSize:'15px', padding:'10px 12px', outline:'none', boxSizing:'border-box' },
  select:    { width:'100%', background:'#06111f', border:'1px solid #0f2444', borderRadius:'8px', color:'white', fontSize:'15px', padding:'10px 12px', outline:'none', cursor:'pointer', boxSizing:'border-box' },
  row:       { display:'flex', gap:'8px', alignItems:'flex-end' },
  locBtn:    { flexShrink:0, padding:'10px 14px', background:'#0f2444', border:'1px solid #163560', borderRadius:'8px', color:'#7db8e8', fontSize:'13px', cursor:'pointer', whiteSpace:'nowrap' },
  locInfo:   { fontSize:'11px', color:'#7db8e8', marginTop:'4px', opacity:0.7 },
  startBtn:  { width:'100%', padding:'16px', background:'#2a6aad', border:'none', borderRadius:'12px', color:'white', fontSize:'17px', fontWeight:600, cursor:'pointer', marginTop:'8px', minHeight:'54px', boxSizing:'border-box' },
  cancelBtn: { width:'100%', padding:'14px', background:'transparent', border:'1px solid #0f2444', borderRadius:'12px', color:'#7db8e8', fontSize:'15px', cursor:'pointer', marginTop:'8px', boxSizing:'border-box' },
}

export default function StartSessionSheet({ conditions, onStart, onCancel }) {
  const [locationName,  setLocationName]  = useState('')
  const [targetSpecies, setTargetSpecies] = useState(conditions.species ?? 'gummy_shark')
  const [baitRig,       setBaitRig]       = useState('Pilchard fillet')
  const [notes,         setNotes]         = useState('')
  const { location, error: locError, loading: locLoading, request } = useLocation()

  const canStart = locationName.trim().length > 0

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onCancel()}>
      <div style={s.sheet}>
        <div style={s.handle} />
        <div style={s.title}>Start session</div>

        <div style={s.field}>
          <label style={s.label}>Location</label>
          <div style={s.row}>
            <input style={{ ...s.input, flex:1 }} placeholder="e.g. The Narrows, Cleeland Bight…" value={locationName} onChange={e => setLocationName(e.target.value)} autoFocus />
            <button style={s.locBtn} onClick={request} disabled={locLoading}>{locLoading ? '…' : '📍 GPS'}</button>
          </div>
          {location  && <div style={s.locInfo}>📍 {location.lat.toFixed(4)}, {location.lng.toFixed(4)} (±{location.accuracy}m)</div>}
          {locError  && <div style={{ ...s.locInfo, color:'#ff7055' }}>{locError}</div>}
        </div>

        <div style={s.field}>
          <label style={s.label}>Target species</label>
          <select style={s.select} value={targetSpecies} onChange={e => setTargetSpecies(e.target.value)}>
            {Object.entries(SPECIES).map(([slug, cfg]) => <option key={slug} value={slug}>{cfg.label}</option>)}
          </select>
        </div>

        <div style={s.field}>
          <label style={s.label}>Bait / rig</label>
          <select style={s.select} value={baitRig} onChange={e => setBaitRig(e.target.value)}>
            {BAIT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        <div style={s.field}>
          <label style={s.label}>Notes (optional)</label>
          <input style={s.input} placeholder="Swell, wind, water colour…" value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        <button
          style={{ ...s.startBtn, opacity: canStart ? 1 : 0.5 }}
          onClick={() => canStart && onStart({ locationName: locationName.trim(), lat: location?.lat ?? null, lng: location?.lng ?? null, targetSpecies, baitRig, notes })}
          disabled={!canStart}
        >
          {canStart ? '🎣 Start session' : 'Enter a location to start'}
        </button>
        <button style={s.cancelBtn} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}
