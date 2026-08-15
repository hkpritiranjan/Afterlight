import {
  MAP_WIDTH,
  MAP_HEIGHT,
  TILE_SIZE,
  PLAYER_RADIUS,
  INTERACTION_RADIUS,
} from './constants';
import type { GameState, Camera, RemotePlayer, MeteorEntity, StarEntity, MeteorCategory } from './types';

// ── Shooting meteor trail ─────────────────────────────────────────────────────
interface ShootingMeteor {
  x0: number; y0: number;
  x1: number; y1: number;
  t: number;       // progress 0→1
  speed: number;   // units/sec
  color: string;
}

// ── Ambient firefly ───────────────────────────────────────────────────────────
interface Firefly {
  baseX: number; baseY: number;
  phase: number; speed: number;
  radius: number;
}

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private dpr: number;
  viewportW = 0;
  viewportH = 0;

  private shootingMeteors: ShootingMeteor[] = [];
  private lastShootSpawn = 0;
  private fireflies: Firefly[] = [];

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.dpr = typeof window !== 'undefined' ? (window.devicePixelRatio ?? 1) : 1;
  }

  resize(logicalW: number, logicalH: number): void {
    this.viewportW = logicalW;
    this.viewportH = logicalH;
    this.canvas.width = Math.floor(logicalW * this.dpr);
    this.canvas.height = Math.floor(logicalH * this.dpr);
    this.canvas.style.width  = logicalW + 'px';
    this.canvas.style.height = logicalH + 'px';
    this.spawnFireflies(logicalW, logicalH);
  }

  private spawnFireflies(w: number, h: number): void {
    this.fireflies = Array.from({ length: 10 }, (_, i) => ({
      baseX:  w * 0.2 + tileRng(i, 0, 0) * w * 0.6,
      baseY:  h * 0.55 + tileRng(i, 0, 1) * h * 0.3,
      phase:  tileRng(i, 0, 2) * Math.PI * 2,
      speed:  0.3 + tileRng(i, 0, 3) * 0.5,
      radius: 18 + tileRng(i, 0, 4) * 30,
    }));
  }

  render(
    state: GameState,
    camera: Camera,
    remotePlayers: ReadonlyMap<string, RemotePlayer>,
    meteors: ReadonlyMap<string, MeteorEntity>,
    stars: ReadonlyMap<string, StarEntity>,
    nearbyMeteorId: string | null,
    now: number,
  ): void {
    const { ctx, dpr, viewportW, viewportH } = this;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Canvas is transparent — background handled by CSS layer
    ctx.clearRect(0, 0, viewportW, viewportH);

    // ── Ambient screen-space effects (below world) ────────────────────────────
    this.drawShootingMeteors(now);
    this.drawFireflies(now);

    // ── World-space drawing (apply camera) ────────────────────────────────────
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    this.drawWorldFloor(camera);
    this.drawBgStars(camera, now);
    this.drawWorldBorder();
    this.drawInteractionZones(state);

    for (const s of stars.values())  this.drawStar(s.x, s.y, now);
    for (const m of meteors.values()) this.drawMeteor(m, m.meteorId === nearbyMeteorId);
    for (const rp of remotePlayers.values()) this.drawRemotePlayer(rp.x, rp.y);
    this.drawPlayer(state);

    ctx.restore();

    // ── Screen-space prompt ───────────────────────────────────────────────────
    if (nearbyMeteorId) {
      this.drawInteractPrompt('Press E to read');
    } else if (state.nearbyZoneId) {
      this.drawInteractPrompt('Press E to release');
    }
  }

  // ── Shooting meteor trail system ────────────────────────────────────────────

  private drawShootingMeteors(now: number): void {
    const ctx = this.ctx;
    const { viewportW } = this;

    // Spawn a new trail every 8–14s
    if (now - this.lastShootSpawn > 8 + tileRng(Math.floor(now / 8), 0, 0) * 6) {
      this.lastShootSpawn = now;
      const TRAIL_COLORS = [
        'rgba(245,197,66,',   // gold
        'rgba(80,200,220,',   // teal
        'rgba(139,111,212,',  // violet
        'rgba(244,114,182,',  // rose
      ];
      const color = TRAIL_COLORS[Math.floor(tileRng(Math.floor(now), 0, 5) * TRAIL_COLORS.length)];
      const angle = (30 + tileRng(Math.floor(now), 1, 0) * 30) * Math.PI / 180; // 30–60° diagonal
      const startX = tileRng(Math.floor(now), 2, 0) * viewportW * 0.8;
      const len = viewportW * 0.4 + tileRng(Math.floor(now), 3, 0) * viewportW * 0.3;
      this.shootingMeteors.push({
        x0: startX,
        y0: -20,
        x1: startX + Math.cos(angle) * len,
        y1: Math.sin(angle) * len,
        t: 0,
        speed: 0.18 + tileRng(Math.floor(now), 4, 0) * 0.14,
        color,
      });
    }

    // Update + draw each active trail
    this.shootingMeteors = this.shootingMeteors.filter((sm) => {
      sm.t += sm.speed * (1 / 60);
      if (sm.t > 1) return false;

      const x = sm.x0 + (sm.x1 - sm.x0) * sm.t;
      const y = sm.y0 + (sm.y1 - sm.y0) * sm.t;
      const t0 = Math.max(0, sm.t - 0.22);
      const tx0 = sm.x0 + (sm.x1 - sm.x0) * t0;
      const ty0 = sm.y0 + (sm.y1 - sm.y0) * t0;

      // Trail gradient
      const grad = ctx.createLinearGradient(tx0, ty0, x, y);
      grad.addColorStop(0, sm.color + '0)');
      grad.addColorStop(0.6, sm.color + '0.55)');
      grad.addColorStop(1,   sm.color + '0.9)');

      ctx.save();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = grad;
      ctx.shadowBlur = 6;
      ctx.shadowColor = sm.color + '0.6)';
      ctx.beginPath();
      ctx.moveTo(tx0, ty0);
      ctx.lineTo(x, y);
      ctx.stroke();

      // Comet head
      ctx.shadowBlur = 12;
      ctx.fillStyle = sm.color + '0.95)';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      return true;
    });
  }

  // ── Ambient fireflies ───────────────────────────────────────────────────────

  private drawFireflies(now: number): void {
    const ctx = this.ctx;
    for (const ff of this.fireflies) {
      const t = now * ff.speed + ff.phase;
      const x = ff.baseX + Math.cos(t * 1.3) * ff.radius;
      const y = ff.baseY + Math.sin(t) * ff.radius * 0.5;
      const alpha = 0.35 + Math.sin(t * 2.1 + ff.phase) * 0.25;

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(0.7, alpha));
      ctx.shadowBlur = 6;
      ctx.shadowColor = 'rgba(251,180,60,0.8)';
      ctx.fillStyle = 'rgba(255,195,80,0.9)';
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ── World floor ─────────────────────────────────────────────────────────────

  private drawWorldFloor(camera: Camera): void {
    const ctx = this.ctx;

    // World area fill — very dark, nearly transparent so CSS bg shows faintly
    ctx.fillStyle = 'rgba(6,4,22,0.75)';
    ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

    // Subtle tile grid
    const margin = TILE_SIZE * 2;
    const startX = Math.floor((camera.x - margin) / TILE_SIZE) * TILE_SIZE;
    const startY = Math.floor((camera.y - margin) / TILE_SIZE) * TILE_SIZE;
    const endX   = camera.x + this.viewportW + margin;
    const endY   = camera.y + this.viewportH + margin;

    ctx.strokeStyle = 'rgba(130,100,220,0.06)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let x = startX; x <= endX; x += TILE_SIZE) {
      ctx.moveTo(x, Math.max(0, startY));
      ctx.lineTo(x, Math.min(MAP_HEIGHT, endY));
    }
    for (let y = startY; y <= endY; y += TILE_SIZE) {
      ctx.moveTo(Math.max(0, startX), y);
      ctx.lineTo(Math.min(MAP_WIDTH, endX), y);
    }
    ctx.stroke();
  }

  // ── Background star field (twinkling ✦) ────────────────────────────────────

  private drawBgStars(camera: Camera, now: number): void {
    const ctx = this.ctx;
    const margin = TILE_SIZE * 4;
    const tStartX = Math.floor((camera.x - margin) / TILE_SIZE);
    const tStartY = Math.floor((camera.y - margin) / TILE_SIZE);
    const tEndX   = tStartX + Math.ceil((this.viewportW + margin * 2) / TILE_SIZE);
    const tEndY   = tStartY + Math.ceil((this.viewportH + margin * 2) / TILE_SIZE);

    for (let ty = tStartY; ty <= tEndY; ty++) {
      for (let tx = tStartX; tx <= tEndX; tx++) {
        if (tx < 0 || ty < 0 || tx * TILE_SIZE > MAP_WIDTH || ty * TILE_SIZE > MAP_HEIGHT) continue;
        const r0 = tileRng(tx, ty, 0);
        if (r0 > 0.91) {
          const sx   = tx * TILE_SIZE + tileRng(tx, ty, 1) * TILE_SIZE;
          const sy   = ty * TILE_SIZE + tileRng(tx, ty, 2) * TILE_SIZE;
          const base = 0.25 + tileRng(tx, ty, 3) * 0.55;
          const freq = 0.4 + tileRng(tx, ty, 5) * 1.3;
          const phase = tileRng(tx, ty, 6) * Math.PI * 2;
          const alpha = Math.max(0.05, Math.min(0.95, base + Math.sin(now * freq + phase) * 0.2));

          const isBright = tileRng(tx, ty, 4) > 0.97;
          const colorR   = tileRng(tx, ty, 7);

          // Color tint
          let color: string;
          if      (colorR < 0.3) color = `rgba(180,200,255,${alpha.toFixed(2)})`;  // cool blue
          else if (colorR < 0.6) color = `rgba(255,240,200,${alpha.toFixed(2)})`;  // warm gold
          else                   color = `rgba(240,235,255,${alpha.toFixed(2)})`;  // white-violet

          if (isBright) {
            // ✦ 4-pointed star shape
            const seed    = tileRng(tx, ty, 8);
            const t       = now * 0.015 + seed;
            const pulse   = 1 + Math.sin(now * 1.2 + seed) * 0.1;
            const outer   = PLAYER_RADIUS * 1.1 * pulse;
            const inner   = outer * 0.22;
            const rot     = t;

            // Glow halo
            const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, outer * 7);
            halo.addColorStop(0, color.replace('rgba', 'rgba').replace(/[\d.]+\)$/, '0.18)'));
            halo.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(sx, sy, outer * 7, 0, Math.PI * 2);
            ctx.fill();

            // Lens-flare cross
            ctx.save();
            ctx.globalAlpha = alpha * 0.5;
            const crossLen = outer * 5;
            const crossGrad = ctx.createLinearGradient(sx - crossLen, sy, sx + crossLen, sy);
            crossGrad.addColorStop(0, 'rgba(255,255,220,0)');
            crossGrad.addColorStop(0.5, `rgba(255,255,220,${(alpha * 0.4).toFixed(2)})`);
            crossGrad.addColorStop(1, 'rgba(255,255,220,0)');
            ctx.strokeStyle = crossGrad;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(sx - crossLen, sy); ctx.lineTo(sx + crossLen, sy);
            ctx.stroke();
            const vGrad = ctx.createLinearGradient(sx, sy - crossLen, sx, sy + crossLen);
            vGrad.addColorStop(0, 'rgba(255,255,220,0)');
            vGrad.addColorStop(0.5, `rgba(255,255,220,${(alpha * 0.4).toFixed(2)})`);
            vGrad.addColorStop(1, 'rgba(255,255,220,0)');
            ctx.strokeStyle = vGrad;
            ctx.beginPath();
            ctx.moveTo(sx, sy - crossLen); ctx.lineTo(sx, sy + crossLen);
            ctx.stroke();
            ctx.restore();

            // ✦ shape
            ctx.save();
            ctx.fillStyle = color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;
            ctx.translate(sx, sy);
            ctx.rotate(rot);
            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
              const r2 = i % 2 === 0 ? outer : inner;
              const a = (i * Math.PI) / 4;
              if (i === 0) ctx.moveTo(Math.cos(a) * r2, Math.sin(a) * r2);
              else         ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          } else {
            ctx.fillStyle = color;
            ctx.fillRect(sx, sy, 1, 1);
          }
        }
      }
    }
  }

  // ── World border ────────────────────────────────────────────────────────────

  private drawWorldBorder(): void {
    const ctx = this.ctx;
    const b = 3;
    ctx.shadowBlur = 24;
    ctx.shadowColor = 'rgba(139,111,212,0.3)';
    ctx.strokeStyle = 'rgba(139,111,212,0.2)';
    ctx.lineWidth = b;
    ctx.strokeRect(b / 2, b / 2, MAP_WIDTH - b, MAP_HEIGHT - b);
    ctx.shadowBlur = 0;
  }

  // ── Interaction zones ───────────────────────────────────────────────────────

  private drawInteractionZones(state: GameState): void {
    const ctx = this.ctx;
    for (const zone of state.interactionZones) {
      const isNearby = zone.id === state.nearbyZoneId;
      const alpha = isNearby ? 0.55 : 0.18;
      const blur  = isNearby ? 14 : 6;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowBlur   = blur;
      ctx.shadowColor  = 'rgba(245,197,66,0.9)';
      ctx.strokeStyle  = 'rgba(245,197,66,0.85)';
      ctx.lineWidth    = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, INTERACTION_RADIUS * 0.65, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(245,197,66,0.6)';
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ── Meteor orb ─────────────────────────────────────────────────────────────

  private drawMeteor(meteor: MeteorEntity, isNearby: boolean): void {
    const ctx = this.ctx;
    const { x, y } = meteor;
    const col = METEOR_COLORS[meteor.category];
    const r    = isNearby ? PLAYER_RADIUS * 1.4 : PLAYER_RADIUS;
    const glowR = r * 5;

    const glow = ctx.createRadialGradient(x, y, 0, x, y, glowR);
    glow.addColorStop(0, col.glow);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, glowR, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.shadowBlur  = isNearby ? 24 : 12;
    ctx.shadowColor = col.shadow;
    ctx.fillStyle   = col.body;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ── Permanent star (✦ with slow pulse) ────────────────────────────────────

  private drawStar(x: number, y: number, now: number): void {
    const ctx  = this.ctx;
    const seed = tileRng(Math.round(x), Math.round(y), 0);
    const t    = now * 0.015 + seed;
    const pulse = 1 + Math.sin(now * 0.8 + seed) * 0.08;
    const outer = PLAYER_RADIUS * 1.2 * pulse;
    const inner = outer * 0.3;

    // Wide glow halo
    const halo = ctx.createRadialGradient(x, y, 0, x, y, outer * 8);
    halo.addColorStop(0, 'rgba(255,245,160,0.20)');
    halo.addColorStop(1, 'rgba(255,240,80,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(x, y, outer * 8, 0, Math.PI * 2);
    ctx.fill();

    // Lens flare
    ctx.save();
    const lf = outer * 6;
    for (const [x0, y0, x1, y1] of [
      [x - lf, y, x + lf, y],
      [x, y - lf, x, y + lf],
    ] as [number, number, number, number][]) {
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, 'rgba(255,255,180,0)');
      g.addColorStop(0.5, 'rgba(255,255,180,0.35)');
      g.addColorStop(1, 'rgba(255,255,180,0)');
      ctx.strokeStyle = g;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
      ctx.stroke();
    }
    ctx.restore();

    // ✦ body
    ctx.save();
    ctx.shadowBlur  = 18;
    ctx.shadowColor = 'rgba(255,245,150,0.9)';
    ctx.fillStyle   = 'rgba(255,250,200,0.95)';
    ctx.translate(x, y);
    ctx.rotate(t);
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const r2 = i % 2 === 0 ? outer : inner;
      const a  = (i * Math.PI) / 4;
      if (i === 0) ctx.moveTo(Math.cos(a) * r2, Math.sin(a) * r2);
      else         ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // ── Remote player ───────────────────────────────────────────────────────────

  private drawRemotePlayer(x: number, y: number): void {
    const ctx = this.ctx;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, PLAYER_RADIUS * 3);
    glow.addColorStop(0, 'rgba(167,139,250,0.14)');
    glow.addColorStop(1, 'rgba(120,80,220,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, PLAYER_RADIUS * 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.shadowBlur  = 10;
    ctx.shadowColor = 'rgba(180,140,255,0.6)';
    ctx.fillStyle   = 'rgba(200,180,255,0.72)';
    ctx.beginPath();
    ctx.arc(x, y, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ── Local player ────────────────────────────────────────────────────────────

  private drawPlayer(state: GameState): void {
    const ctx = this.ctx;
    const { x, y } = state.player;

    const glow = ctx.createRadialGradient(x, y, 0, x, y, PLAYER_RADIUS * 3.5);
    glow.addColorStop(0, 'rgba(200,230,255,0.22)');
    glow.addColorStop(1, 'rgba(91,156,246,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, PLAYER_RADIUS * 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.shadowBlur  = 18;
    ctx.shadowColor = 'rgba(160,210,255,0.9)';
    ctx.fillStyle   = 'rgba(225,242,255,0.96)';
    ctx.beginPath();
    ctx.arc(x, y, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ── Interact prompt ─────────────────────────────────────────────────────────

  private drawInteractPrompt(text: string): void {
    const ctx = this.ctx;
    const cx = this.viewportW / 2;
    const cy = this.viewportH * 0.72;

    ctx.save();
    ctx.font = '600 13px system-ui, -apple-system, sans-serif';
    const w = ctx.measureText(text).width + 28;

    ctx.fillStyle = 'rgba(8,6,28,0.75)';
    ctx.strokeStyle = 'rgba(139,111,212,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    roundRect(ctx, cx - w / 2, cy - 14, w, 28, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(180,160,240,0.95)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, cx, cy);
    ctx.restore();
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

type CategoryColors = { glow: string; shadow: string; body: string };
const METEOR_COLORS: Record<MeteorCategory, CategoryColors> = {
  burden:    { glow: 'rgba(220,80,80,0.18)',   shadow: 'rgba(220,80,80,0.8)',   body: 'rgba(240,140,140,0.9)' },
  moment:    { glow: 'rgba(80,200,220,0.18)',  shadow: 'rgba(80,200,220,0.8)',  body: 'rgba(140,220,240,0.9)' },
  hope:      { glow: 'rgba(74,222,128,0.18)',  shadow: 'rgba(74,222,128,0.8)',  body: 'rgba(140,230,170,0.9)' },
  gratitude: { glow: 'rgba(245,197,66,0.18)',  shadow: 'rgba(245,197,66,0.8)',  body: 'rgba(250,220,120,0.9)' },
};

function tileRng(tx: number, ty: number, offset: number): number {
  const n = Math.sin(tx * 127.1 + ty * 311.7 + offset * 74.3) * 43758.5453;
  return n - Math.floor(n);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y,     x + w, y + r,     r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x,     y + h, x,     y + h - r, r);
  ctx.lineTo(x,     y + r);
  ctx.arcTo(x,     y,     x + r, y,         r);
  ctx.closePath();
}
