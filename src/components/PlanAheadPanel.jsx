import { formatTime, todMultiplier, BARO_OPTIONS } from '../lib/probability.js'

const TIDE_OPTIONS = [
  { value:'flood_early', label:'Rising — early flood' },
  { value:'flood_peak',  label:'Rising — peak flood' },
  { value:'high',        label:'High water slack' },
  { value:'ebb_early',   label:'Falling — early ebb' },
  { value:'ebb_peak',    label:'Falling — peak ebb' },
  { value:'low',         label:'Low water slack' },
]

const MONTH_OPTIONS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

const styles = {
  panel:   { display:'flex', flexDirection:'column', background:'#06111f', borderBottom:'1px solid #0f2444' },
  row:     { display:'flex', flexWrap:'wrap', gap:'12px', padding:'10px 16px', borderBottom:'1px solid #0f2444' },
  ctrl:    { display:'flex', flexDirection:'column', minWidth:'140px' },
  label:   { fontSize:'10px', fontWeight:500, color:'#7db8e8', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'4px' },
  select:  { background:'#0a1a30', border:'1px solid #0f2444', color:'white', fontSize:'12px', borderRadius:'4px', padding:'4px 8px', cursor:'pointer' },
  timeBar: { display:'flex', alignItems:'center', gap:'12px', padding:'8px 16px' },
  pill:    { fontSize:'11px', fontWeight:500, padding:'2px 10px', borderRadius:'10px', whiteSpace:'nowrap' },
}

function badgeStyle(mult) {
  if (mult >= 0.90) return { ...styles.pill, background:'rgba(0,180,80,0.2)',  color:'#4ddd99', border:'1px solid rgba(0,180,80,0.3)' }
  if (mult >= 0.70) return { ...styles.pill, background:'rgba(215,185,0,0.2)', color:'#e8cc44', border:'1px solid rgba(215,185,0,0.3)' }
  return                   { ...styles.pill, background:'rgba(255,80,0,0.2)',  color:'#ff7055', border:'1px solid rgba(255,80,0,0.3)' }
}

export default function PlanAheadPanel({ conditions, onChange, species }) {
  const set      = (key) => (e) => onChange({ ...conditions, [key]: e.target.value })
  const setMonth = (e)   => onChange({ ...conditions, month: parseInt(e.target.value) })
  const todM     = todMultiplier(conditions.tod)

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
          <label style={styles.label}>Month</label>
          <select style={styles.select} value={conditions.month} onChange={setMonth}>
            {MONTH_OPTIONS.map((name, i) => <option key={i} value={i+1}>{name}</option>)}
          </select>
        </div>
        <div style={styles.ctrl}>
          <label style={styles.label}>Tide state</label>
          <select style={styles.select} value={conditions.tide} onChange={set('tide')}>
            {TIDE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div style={styles.ctrl}>
          <label style={styles.label}>Barometer</label>
          <select style={styles.select} value={conditions.baro} onChange={set('baro')}>
            {BARO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
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
