// Dot-matrix world map (equirectangular), per-country coloring, routes and city pins.
import { W, H, C, rgba, clamp, lerp, ease } from './core.js';

export const CITY = {
  'New York': [-74.0, 40.7], 'Reykjavik': [-21.9, 64.1], 'Belgrade': [20.5, 44.8], 'Budapest': [19.0, 47.5],
  'Manila': [121.0, 14.6], 'Tokyo': [139.7, 35.7], 'Pasadena': [-118.1, 34.1], 'Moscow': [37.6, 55.75],
  'Vienna': [16.37, 48.21], 'Paris': [2.35, 48.86], 'London': [-0.13, 51.51], 'Philadelphia': [-75.17, 39.95],
};
export const ISO = { AUT: 40, FRA: 250, GBR: 826, USA: 840, ISL: 352, SRB: 688, MNE: 499, HUN: 348, PHL: 608, JPN: 392, RUS: 643 };

export class DotMap {
  async init() {
    const world = await fetch('../engine/data/countries-110m.json').then(r => r.json());
    const fc = topojson.feature(world, world.objects.countries);
    this.MW = 2880; this.MH = 1440;
    const c = document.createElement('canvas'); c.width = this.MW; c.height = this.MH;
    const g = c.getContext('2d');
    this.ids = [0];
    fc.features.forEach((f, i) => {
      this.ids.push(+f.id || 0);
      const k = i + 1; g.fillStyle = `rgb(${k & 255},${(k >> 8) & 255},200)`;
      g.beginPath();
      const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
      for (const poly of polys) for (const ring of poly) {
        // unwrap rings that cross the antimeridian, then draw them shifted by ±360°
        let prev = null, off = 0;
        const un = ring.map(([lon, lat]) => { if (prev !== null && Math.abs(lon - prev) > 180) off += lon > prev ? -360 : 360; prev = lon; return [lon + off, lat]; });
        for (const shift of [-360, 0, 360]) {
          un.forEach(([lon, lat], j) => {
            const x = (lon + shift + 180) / 360 * this.MW, y = (90 - lat) / 180 * this.MH;
            j ? g.lineTo(x, y) : g.moveTo(x, y);
          });
          g.closePath();
        }
      }
      g.fill('evenodd');
    });
    this.px = g.getImageData(0, 0, this.MW, this.MH).data;
    return this;
  }
  // country id at lon/lat (0 = ocean, -1 = land of unknown id)
  at(lon, lat) {
    const x = Math.floor((lon + 180) / 360 * this.MW), y = Math.floor((90 - lat) / 180 * this.MH);
    if (x < 0 || y < 0 || x >= this.MW || y >= this.MH) return 0;
    const i = (y * this.MW + x) * 4, d = this.px;
    if (d[i + 3] < 128) return 0;
    if (d[i + 2] !== 200) return -1;
    return this.ids[d[i] + (d[i + 1] << 8)] ?? -1;
  }
  view({ lon = 0, lat = 30, zoom = 6, cy = H * 0.46 } = {}) { this.v = { lon, lat, zoom, cy }; return this; }
  proj(lon, lat) { const v = this.v; return [W / 2 + (lon - v.lon) * v.zoom, v.cy - (lat - v.lat) * v.zoom * 1.18]; }
  draw(ctx, { spacing = 15, base = '#4F7787', color = null, alpha = 1, ocean = 0.0, minLat = -56 } = {}) {
    const v = this.v, step = spacing / v.zoom;
    const lon0 = v.lon - W / 2 / v.zoom, lon1 = v.lon + W / 2 / v.zoom;
    const lat1 = v.lat + v.cy / (v.zoom * 1.18), lat0 = v.lat - (H - v.cy) / (v.zoom * 1.18);
    const r = spacing * 0.34;
    ctx.save(); ctx.globalAlpha *= alpha;
    const groups = new Map();
    for (let lat = Math.floor(Math.max(lat0, minLat) / step) * step; lat <= lat1; lat += step) {
      for (let lon = Math.floor(lon0 / step) * step; lon <= lon1; lon += step) {
        const id = this.at(lon, lat);
        let col = id === 0 ? (ocean > 0 ? rgba(base, ocean) : null) : (color && color(id, lon, lat)) || base;
        if (!col) continue;
        const [x, y] = this.proj(lon, lat);
        if (!groups.has(col)) groups.set(col, []);
        groups.get(col).push(x, y);
      }
    }
    for (const [col, pts] of groups) {
      ctx.fillStyle = col; ctx.beginPath();
      for (let i = 0; i < pts.length; i += 2) { ctx.moveTo(pts[i] + r, pts[i + 1]); ctx.arc(pts[i], pts[i + 1], r, 0, 6.283); }
      ctx.fill();
    }
    ctx.restore();
  }
  pin(ctx, name, { color = C.gold, a = 1, label = true, pulse = 0, below = false } = {}) {
    if (a <= 0) return;
    const [x, y] = this.proj(...CITY[name]);
    ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.arc(x, y, 10, 0, 7); ctx.fill();
    if (pulse) { ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.globalAlpha *= 1 - pulse; ctx.beginPath(); ctx.arc(x, y, 10 + pulse * 40, 0, 7); ctx.stroke(); ctx.globalAlpha /= (1 - pulse) || 1; }
    if (label) {
      ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 8; ctx.font = '800 26px "JetBrains Mono"'; ctx.textAlign = 'center';
      ctx.letterSpacing = '3px'; ctx.fillStyle = '#EAF2F4'; ctx.fillText(name.toUpperCase(), x, below ? y + 46 : y - 24);
    }
    ctx.restore();
  }
  // dotted arc route from city a to b, drawn up to progress u; returns head position
  route(ctx, a, b, u, { color = C.gold, bend = 0.25, a: alpha = 1, dash = [4, 14], lw = 6 } = {}) {
    const [x0, y0] = this.proj(...CITY[a]), [x1, y1] = this.proj(...CITY[b]);
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2 - Math.hypot(x1 - x0, y1 - y0) * bend;
    const P = s => [(1 - s) ** 2 * x0 + 2 * (1 - s) * s * mx + s * s * x1, (1 - s) ** 2 * y0 + 2 * (1 - s) * s * my + s * s * y1];
    ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.setLineDash(dash);
    ctx.shadowColor = color; ctx.shadowBlur = 12; ctx.beginPath();
    const n = 60, end = clamp(u);
    for (let i = 0; i <= n; i++) { const [x, y] = P(end * i / n); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke(); ctx.restore();
    return P(end);
  }
}
