import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { VIC_BOUNDS } from '../data/constants.js'
import { getDepth, depthToRGB } from '../data/bathymetry.js'
import { computeProbability, probToRGB } from '../lib/probability.js'

const WP = { minLat:-38.65, maxLat:-38.10, minLng:145.10, maxLng:145.90 }
const SEGS_X = 120, SEGS_Z = 90, MESH_W = 7, MESH_D = 5, DEPTH_SCALE = 2.5

export default function BathymetryView({ conditions, visible }) {
  const canvasRef = useRef(null)
  const stateRef  = useRef({})

  function buildTerrain(scene, cond) {
    const s = stateRef.current
    if (s.mesh) { scene.remove(s.mesh); s.mesh.geometry.dispose(); s.mesh.material.dispose() }
    if (s.wire) { scene.remove(s.wire); s.wire.geometry.dispose(); s.wire.material.dispose() }

    const geo = new THREE.PlaneGeometry(MESH_W, MESH_D, SEGS_X, SEGS_Z)
    geo.rotateX(-Math.PI / 2)
    const pos    = geo.attributes.position
    const colors = new Float32Array(pos.count * 3)

    for (let i = 0; i < pos.count; i++) {
      const nx = (pos.getX(i) + MESH_W/2) / MESH_W
      const nz = (pos.getZ(i) + MESH_D/2) / MESH_D
      const lng = WP.minLng + nx*(WP.maxLng-WP.minLng)
      const lat = WP.maxLat - nz*(WP.maxLat-WP.minLat)
      const depth = getDepth(lat, lng)
      pos.setY(i, -depth * DEPTH_SCALE)
      const prob = computeProbability({ lat, lng, ...cond })
      const [dr,dg,db] = depthToRGB(depth)
      const [pr,pg,pb] = probToRGB(prob)
      const blend = prob * 0.25
      colors[i*3]   = (dr*(1-blend)+pr*blend)/255
      colors[i*3+1] = (dg*(1-blend)+pg*blend)/255
      colors[i*3+2] = (db*(1-blend)+pb*blend)/255
    }
    pos.needsUpdate = true
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.computeVertexNormals()
    s.mesh = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ vertexColors:true, shininess:20 }))
    scene.add(s.mesh)
  }

  useEffect(() => {
    if (!visible) return
    const canvas = canvasRef.current
    if (!canvas) return
    const W = canvas.offsetWidth || 680, H = canvas.offsetHeight || 460
    const scene    = new THREE.Scene()
    scene.background = new THREE.Color(0x040d1a)
    scene.fog        = new THREE.FogExp2(0x040d1a, 0.028)
    const camera   = new THREE.PerspectiveCamera(48, W/H, 0.01, 200)
    camera.position.set(0, 4, 7)
    camera.lookAt(0, -0.5, 0)
    const renderer = new THREE.WebGLRenderer({ canvas, antialias:true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    scene.add(new THREE.AmbientLight(0x7090bb, 0.9))
    const sun = new THREE.DirectionalLight(0xaaccff, 2.0)
    sun.position.set(5,10,6); scene.add(sun)

    stateRef.current = { scene, camera, renderer, buildTerrain }
    buildTerrain(scene, conditions)

    let drag=false, lastX=0, lastY=0, theta=0.3, phi=0.45, radius=9
    const updateCamera = () => {
      camera.position.x = radius*Math.sin(theta)*Math.cos(phi)
      camera.position.y = radius*Math.sin(phi)
      camera.position.z = radius*Math.cos(theta)*Math.cos(phi)
      camera.lookAt(0,-0.8,0)
    }
    updateCamera()
    canvas.addEventListener('mousedown', e => { drag=true; lastX=e.clientX; lastY=e.clientY })
    window.addEventListener('mouseup', () => { drag=false })
    canvas.addEventListener('mousemove', e => {
      if (!drag) return
      theta -= (e.clientX-lastX)*0.007
      phi = Math.max(0.08, Math.min(1.2, phi-(e.clientY-lastY)*0.005))
      lastX=e.clientX; lastY=e.clientY; updateCamera()
    })
    canvas.addEventListener('wheel', e => { radius=Math.max(3,Math.min(18,radius+e.deltaY*0.012)); updateCamera(); e.preventDefault() }, { passive:false })

    let rafId
    const animate = () => { rafId=requestAnimationFrame(animate); renderer.render(scene,camera) }
    animate()
    const ro = new ResizeObserver(() => { camera.aspect=canvas.offsetWidth/canvas.offsetHeight; camera.updateProjectionMatrix(); renderer.setSize(canvas.offsetWidth,canvas.offsetHeight) })
    ro.observe(canvas)
    return () => { cancelAnimationFrame(rafId); ro.disconnect(); renderer.dispose() }
  }, [visible])

  useEffect(() => {
    const s = stateRef.current
    if (!visible || !s.scene) return
    buildTerrain(s.scene, conditions)
  }, [conditions, visible])

  return (
    <div style={{ position:'relative', width:'100%', height:'100%' }}>
      <canvas ref={canvasRef} style={{ width:'100%', height:'100%', display:'block' }} />
      <div style={{ position:'absolute', bottom:12, right:12, background:'rgba(4,13,26,0.88)', border:'1px solid #0f2444', borderRadius:'8px', padding:'9px 12px' }}>
        <p style={{ fontSize:'10px', color:'#7db8e8', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'6px' }}>Depth</p>
        {[['rgb(210,235,255)','0–2m'],['rgb(140,195,235)','2–5m'],['rgb(75,150,210)','5–9m'],['rgb(40,105,175)','9–13m'],['rgb(18,65,135)','13–17m'],['rgb(8,28,80)','17–20m']].map(([c,l]) => (
          <div key={l} style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'3px' }}>
            <div style={{ width:'14px', height:'8px', borderRadius:'2px', background:c }} />
            <span style={{ fontSize:'10px', color:'rgba(125,184,232,0.7)' }}>{l}</span>
          </div>
        ))}
      </div>
      <div style={{ position:'absolute', bottom:12, left:12, background:'rgba(4,13,26,0.88)', border:'1px solid #0f2444', borderRadius:'8px', padding:'8px 12px' }}>
        <p style={{ fontSize:'11px', color:'rgba(125,184,232,0.6)', margin:0 }}>Drag to orbit · Scroll to zoom</p>
      </div>
    </div>
  )
}
