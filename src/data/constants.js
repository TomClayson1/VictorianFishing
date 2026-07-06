export const VIC_BOUNDS = {
  minLat: -39.20,
  maxLat: -37.40,
  minLng: 141.00,
  maxLng: 149.90,
  center: [-38.20, 145.50],
  zoom: 8,
}

export const WP_BOUNDS = {
  minLat: -38.65,
  maxLat: -38.10,
  minLng: 145.10,
  maxLng: 145.90,
}

export const TILE_LAYERS = {
  esriOcean: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles © Esri',
    maxZoom: 16,
  },
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18,
  },
}
