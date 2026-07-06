// Synthetic bathymetric depth model for Western Port Bay
// Replace with real AusSeabed data when available

const DEPTH_ANCHORS = [
  { lat:-38.345, lng:145.315, depth:0.90, radius:0.06 },
  { lat:-38.420, lng:145.520, depth:0.95, radius:0.07 },
  { lat:-38.490, lng:145.420, depth:0.85, radius:0.08 },
  { lat:-38.380, lng:145.225, depth:0.78, radius:0.05 },
  { lat:-38.575, lng:145.440, depth:0.80, radius:0.06 },
  { lat:-38.325, lng:145.610, depth:0.72, radius:0.05 },
  { lat:-38.250, lng:145.400, depth:0.65, radius:0.07 },
  { lat:-38.220, lng:145.480, depth:0.10, radius:0.08 },
  { lat:-38.505, lng:145.225, depth:0.08, radius:0.06 },
  { lat:-38.575, lng:145.555, depth:0.15, radius:0.05 },
  { lat:-38.260, lng:145.350, depth:0.12, radius:0.07 },
  { lat:-38.460, lng:145.660, depth:0.18, radius:0.06 },
]

export function getDepth(lat, lng) {
  let numerator = 0, denominator = 0
  DEPTH_ANCHORS.forEach(a => {
    const w = Math.exp(-((lat-a.lat)**2 + (lng-a.lng)**2) / (a.radius*a.radius))
    numerator   += w * a.depth
    denominator += w
  })
  numerator   += 0.05 * 0.35
  denominator += 0.05
  return Math.max(0.02, Math.min(1.0, numerator / denominator))
}

export function depthToMetres(d) { return Math.round(d * 20 * 10) / 10 }

export function depthToRGB(d) {
  const stops = [
    [0.00,[210,235,255]],[0.20,[140,195,235]],[0.40,[75,150,210]],
    [0.60,[40,105,175]], [0.80,[18,65,135]],  [1.00,[8,28,80]],
  ]
  d = Math.max(0, Math.min(1, d))
  for (let i = 1; i < stops.length; i++) {
    if (d <= stops[i][0]) {
      const t = (d - stops[i-1][0]) / (stops[i][0] - stops[i-1][0])
      const a = stops[i-1][1], b = stops[i][1]
      return [Math.round(a[0]+t*(b[0]-a[0])), Math.round(a[1]+t*(b[1]-a[1])), Math.round(a[2]+t*(b[2]-a[2]))]
    }
  }
  return [8,28,80]
}
