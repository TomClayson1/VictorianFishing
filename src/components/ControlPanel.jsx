import { useEffect } from 'react'
import { getTideState, loadConditionsForDateTime } from '../lib/liveConditions.js'
import { formatTime, todMultiplier } from '../lib/probability.js'

function getDateOptions() {
  const options = []
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() + i)
    options.push({
      value: d.toISOString().split('T')[0],
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow'
        : d.toLocaleDateString('en-AU', { weekday:'short', day:'numeric', month:'short' }),
    })
  }
  return options
}

const DATE_OPTIONS = getDateOptions()
const TODAY_STR = new Date().toISOString().split('T')[0]

const styles = {
  panel:   { display:'flex', flexDirection:'column', background:'#06111f', borderBottom:'1px solid #0f2444' },
  row:     { display:'flex', flexWrap:'wrap', gap:'12px', padding:'10px 16px', borderBottom:'1px solid #0f2444' },
  ctrl:    { display:'flex', flexDirection:'column', minWidth:'140px' },
  label:   { fontSize:'10px', fontWeight:500, color:'#7db8e8', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'4px' },
  select:  { background:'#0a1a30', border:'1px solid #0f2444', color:'white', fontSize:'12px', borderRadius:'4px', padding:'4px 8px', cursor:'pointer' },
  readOnly:{ fontSize:'12px', color:'#7db8e8', padding:'4px 8px', border:'1px solid #0f2444', borderRadius:'4px', background:'rgba(42,106,173,0.1)', lineHeight:'1.6' },
  timeBar: { display:'flex', alignItems:'center', gap:'12px', padding:'8px 16px' },
  pill:    { fontSize:'11px', fontWeight:500, padding:'2px 10px', borderRadius:'10px', whiteSpace:'nowrap' },
}

function badgeStyle(mult) {
  if (mult >= 0.90) return { ...styles.pill, background:'rgba(0,180,80,0.2)',  color:'#4ddd99', border:'1px solid rgba(0,180,80,0.3)' }
  if (mult >= 0.70) return { ...styles.pill, background:'rgba(215,185,0,0.2)', color:'#e8cc44', border:'1px solid rgba(215,185,0,0.3)' }
  return                   { ...styles.pill, background:'rgba(255,80,0,0.2)',  color:'#ff7055', border:'1px solid rgba(255,80,0,0.3)' }
}

export default function ControlPanel({ conditions, onChange, species }) {
  const set = (key) => (e) => onChange({ ...conditions, [key]: e.target.value })
  const isToday = conditions.planDate === TODAY_STR

  useEffect(() => {
    if (!conditions.planDate) return
    const [y, m, d] = conditions.planDate.split('-').map(Number)
    const date = new Date(y, m-1, d, Math.floor(conditions.tod/60), conditions.tod%60, 0)
    loadConditionsForDateTime(date).then(live => {
      const baro = conditions.planDate === TODAY_STR ? conditions.baro : 'stable'
      onChange({ ...conditions, ...live, baro })
    })
  }, [conditions.planDate, conditions.tod])

  const todM = todMultiplier(conditions.tod)

  return (
    <div style={styles.panel}>
      <div style={styles.row}>
        <div style={styles.ctrl}>
          <label style={styles.label}>Species</label>
          <select style={styles.select} value={conditions.species} onChange={set('species')}>
            {Object.entries(species).map(([slug, cfg]) => (
              <option key={slug} value={slug}>{cfg.label}</option>
            ))}
          </select>
        </div>
        <div style={styles.ctrl}>
          <label style={styles.label}>Day</label>
          <select style={styles.select} value={conditions.planDate} onChange={set('planDate')}>
            {DATE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div style={styles.ctrl}>
          <label style={styles.label}>Tide (auto)</label>
          <div style={styles.readOnly}>{conditions.tideLabel ?? '—'}</div>
        </div>
        <div style={styles.ctrl}>
          <label style={styles.label}>Pressure</label>
          <div style={styles.readOnly}>
            {isToday ? (conditions.hPa ? `${conditions.hPa} hPa (live)` : '—') : 'Not forecast'}
          </div>
        </div>
      </div>
      <div style={styles.timeBar}>
        <span style={{ fontSize:'10px', fontWeight:500, color:'#7db8e8', textTransform:'uppercase', letterSpacing:'0.08em', whiteSpace:'nowrap' }}>
          Time of day
        </span>
        <input type="range" min={0} max={1380} step={30} value={conditions.tod}
          onChange={e => onChange({ ...conditions, tod: parseInt(e.target.value) })}
          style={{ flex:1, accentColor:'#2a6aad', cursor:'pointer' }} />
        <span style={{ fontFamily:'monospace', fontSize:'13px', fontWeight:500, color:'white', minWidth:'44px', textAlign:'right' }}>
          {formatTime(conditions.tod)}
        </span>
        <span style={badgeStyle(todM)}>×{todM.toFixed(2)}</span>
      </div>
    </div>
  )
}
