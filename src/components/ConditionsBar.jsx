import { tideDescription } from '../lib/liveConditions.js'
import { formatTime } from '../lib/probability.js'

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const baroLabel = {
  rising_fast:'↑↑ Rising fast', rising_slow:'↑ Rising',
  stable:'→ Stable', falling_slow:'↓ Falling', falling_fast:'↓↓ Falling fast',
}

const s = {
  bar:     { display:'flex', alignItems:'stretch', flexWrap:'wrap', background:'#06111f', borderBottom:'1px solid #0f2444', overflowX:'auto' },
  loading: { display:'flex', alignItems:'center', padding:'8px 16px', background:'#06111f', borderBottom:'1px solid #0f2444', fontSize:'12px', color:'#7db8e8', gap:'8px' },
  badge:   { display:'flex', alignItems:'center', padding:'0 12px', borderRight:'1px solid #0f2444', gap:'6px', flexShrink:0 },
  dot:     { width:'7px', height:'7px', borderRadius:'50%', background:'#00cc66', boxShadow:'0 0 6px #00cc66' },
  live:    { fontSize:'10px', color:'#00cc66', fontWeight:500, letterSpacing:'0.08em' },
  pill:    { display:'flex', flexDirection:'column', padding:'5px 12px', borderRight:'1px solid #0f2444', flexShrink:0 },
  lbl:     { fontSize:'9px', color:'rgba(125,184,232,0.6)', textTransform:'uppercase', letterSpacing:'0.06em' },
  val:     { fontSize:'12px', fontWeight:500, color:'white', lineHeight:1.3, marginTop:'1px' },
  sub:     { fontSize:'10px', color:'#7db8e8', marginTop:'1px' },
}

function Pill({ label, value, sub }) {
  if (!value) return null
  return (
    <div style={s.pill}>
      <span style={s.lbl}>{label}</span>
      <span style={s.val}>{value}</span>
      {sub && <span style={s.sub}>{sub}</span>}
    </div>
  )
}

export default function ConditionsBar({ conditions, loading }) {
  if (loading) return (
    <div style={s.loading}><span style={{ fontSize:'14px' }}>⟳</span> Loading live conditions…</div>
  )

  const windStr = conditions.windSpeedKts
    ? `${conditions.windSpeedKts}kts ${conditions.windDirLabel ?? ''}`
    : null

  return (
    <div style={s.bar}>
      <div style={s.badge}>
        <div style={s.dot} />
        <span style={s.live}>LIVE</span>
      </div>
      <Pill label="Time"     value={formatTime(conditions.tod)} />
      <Pill label="Month"    value={MONTH_NAMES[(conditions.month ?? 1) - 1]} />
      <Pill label="Tide"     value={tideDescription(conditions.tide)} />
      <Pill label="Pressure" value={baroLabel[conditions.baro] ?? conditions.baro} sub={conditions.hPa ? `${conditions.hPa} hPa` : null} />
      <Pill label="Wind"     value={windStr} />
      <Pill label="Humidity" value={conditions.humidity ? `${conditions.humidity}%` : null} />
      <Pill label="Cloud"    value={conditions.cloudCover != null ? `${conditions.cloudCover}%` : null} />
      <Pill label="Air temp" value={conditions.airTemp != null ? `${conditions.airTemp}°C` : null} />
      <Pill label="Moon"     value={conditions.moonEmoji ? `${conditions.moonEmoji} ${conditions.moonLabel}` : null} />
    </div>
  )
}
