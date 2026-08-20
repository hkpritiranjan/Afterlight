import {
  MAP_WIDTH,
  MAP_HEIGHT,
  TILE_SIZE,
  PLAYER_RADIUS,
  INTERACTION_RADIUS,
} from './constants';
import type { GameState, Camera, RemotePlayer, MeteorEntity, StarEntity, MeteorCategory } from './types';

// ── Scene constants ───────────────────────────────────────────────────────────

const CX = MAP_WIDTH / 2;   // 1920
const CY = MAP_HEIGHT / 2;  // 1440

const TREES = [
  { x: CX - 270, y: CY - 140, h: 90, cr: 38 },
  { x: CX - 220, y: CY + 110, h: 70, cr: 28 },
  { x: CX + 230, y: CY - 130, h: 85, cr: 35 },
  { x: CX + 180, y: CY + 160, h: 65, cr: 25 },
  { x: CX - 120, y: CY - 220, h: 60, cr: 22 },
  { x: CX + 80,  y: CY - 230, h: 65, cr: 24 },
  { x: CX - 320, y: CY + 60,  h: 80, cr: 32 },
  { x: CX + 320, y: CY + 80,  h: 75, cr: 30 },
];

const LANTERNS = [
  { x: CX,      y: CY + 200 },
  { x: CX + 20, y: CY + 80  },
  { x: CX + 60, y: CY - 80  },
  { x: CX + 100, y: CY - 180 },
];

const POND = { cx: CX - 160, cy: CY + 40, rx: 110, ry: 65 };

const ROCKS = [
  { x: CX + 160, y: CY + 70,  rx: 18, ry: 12, rot: 0.3  },
  { x: CX + 175, y: CY + 85,  rx: 12, ry: 9,  rot: -0.4 },
  { x: CX - 160, y: CY - 110, rx: 15, ry: 10, rot: 0.7  },
  { x: CX + 240, y: CY + 130, rx: 22, ry: 14, rot: -0.2 },
  { x: CX - 240, y: CY + 90,  rx: 16, ry: 11, rot: 0.5  },
];

const BENCH = { x: CX + 180, y: CY - 40 };

const PATH_POINTS = [
  { x: CX,      y: CY + 280 },
  { x: CX + 10, y: CY + 120 },
  { x: CX + 30, y: CY - 20  },
  { x: CX + 70, y: CY - 140 },
  { x: CX + 110, y: CY - 260 },
];

// ── Shooting meteor trail ─────────────────────────────────────────────────────
interface ShootingMeteor {
  x0: number; y0: number;
  x1: number; y1: number;
  t: number;
  speed: number;
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
  private worldFadeStart = 0;

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
    if (this.worldFadeStart === 0) {
      this.worldFadeStart = performance.now() / 1000;
    }
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
    dirX: number,
    dirY: number,
  ): void {
    const { ctx, dpr, viewportW, viewportH } = this;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, viewportW, viewportH);

    // ── Screen-space ambient effects ──────────────────────────────────────────
    this.drawShootingMeteors(now);
    this.drawFireflies(now);

    // ── World-space drawing (apply camera) ────────────────────────────────────
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    this.drawWorldGround(camera);
    this.drawPond(now);
    this.drawPath();
    this.drawBgStars(camera, now);
    this.drawWorldBorder();
    this.drawRocks();
    this.drawTrees();
    this.drawBench();
    this.drawInteractionZones(state);
    this.drawLanterns(now);

    for (const s of stars.values())    this.drawStar(s.x, s.y, now);
    for (const m of meteors.values())  this.drawMeteor(m, m.meteorId === nearbyMeteorId, now);
    for (const rp of remotePlayers.values()) this.drawRemotePlayer(rp.x, rp.y);
    this.drawPlayer(state, now, dirX, dirY);

    ctx.restore();

    // ── Screen-space prompt ───────────────────────────────────────────────────
    if (nearbyMeteorId) {
      this.drawInteractPrompt('E  Listen', 'Something is waiting here.');
    } else if (state.nearbyZoneId) {
      this.drawInteractPrompt('E  Release', 'A quiet place to let go.');
    }

    // ── World-entry fade overlay (screen space) ───────────────────────────────
    this.drawWorldFade(now);
  }

  // ── Shooting meteor trail system ────────────────────────────────────────────

  private drawShootingMeteors(now: number): void {
    const ctx = this.ctx;
    const { viewportW } = this;

    if (now - this.lastShootSpawn > 8 + tileRng(Math.floor(now / 8), 0, 0) * 6) {
      this.lastShootSpawn = now;
      const TRAIL_COLORS = [
        'rgba(245,197,66,',
        'rgba(80,200,220,',
        'rgba(139,111,212,',
        'rgba(244,114,182,',
      ];
      const color = TRAIL_COLORS[Math.floor(tileRng(Math.floor(now), 0, 5) * TRAIL_COLORS.length)];
      const angle = (30 + tileRng(Math.floor(now), 1, 0) * 30) * Math.PI / 180;
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

    this.shootingMeteors = this.shootingMeteors.filter((sm) => {
      sm.t += sm.speed * (1 / 60);
      if (sm.t > 1) return false;

      const x = sm.x0 + (sm.x1 - sm.x0) * sm.t;
      const y = sm.y0 + (sm.y1 - sm.y0) * sm.t;
      const t0 = Math.max(0, sm.t - 0.22);
      const tx0 = sm.x0 + (sm.x1 - sm.x0) * t0;
      const ty0 = sm.y0 + (sm.y1 - sm.y0) * t0;

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

  // ── World ground (replaces drawWorldFloor) ──────────────────────────────────

  private drawWorldGround(camera: Camera): void {
    const ctx = this.ctx;

    ctx.fillStyle = 'rgba(5,3,18,1)';
    ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

    const grad = ctx.createRadialGradient(CX, CY, 0, CX, CY, 420);
    grad.addColorStop(0,   'rgba(22,16,38,0.9)');
    grad.addColorStop(0.5, 'rgba(12,9,26,0.6)');
    grad.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(CX, CY, 420, 0, Math.PI * 2);
    ctx.fill();

    const viewR = 500;
    for (let i = 0; i < 60; i++) {
      const gx = CX - 320 + tileRng(i, 7, 0) * 640;
      const gy = CY - 280 + tileRng(i, 7, 1) * 560;
      if (Math.abs(gx - (camera.x + this.viewportW / 2)) > viewR) continue;
      if (Math.abs(gy - (camera.y + this.viewportH / 2)) > viewR) continue;
      const gw = 6 + tileRng(i, 7, 2) * 10;
      const gh = 3 + tileRng(i, 7, 3) * 5;
      ctx.save();
      ctx.globalAlpha = 0.45 + tileRng(i, 7, 4) * 0.25;
      ctx.fillStyle = `rgba(${14 + Math.floor(tileRng(i, 7, 5) * 12)},${32 + Math.floor(tileRng(i, 7, 6) * 16)},${16 + Math.floor(tileRng(i, 7, 7) * 10)},1)`;
      ctx.translate(gx, gy);
      ctx.rotate(tileRng(i, 7, 8) * 0.8 - 0.4);
      ctx.beginPath();
      ctx.ellipse(0, 0, gw / 2, gh / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ── Pond with shimmer ───────────────────────────────────────────────────────

  private drawPond(now: number): void {
    const ctx = this.ctx;
    const { cx, cy, rx, ry } = POND;

    ctx.save();
    const waterGrad = ctx.createRadialGradient(cx, cy - 10, 0, cx, cy, rx);
    waterGrad.addColorStop(0,   'rgba(18,28,55,0.95)');
    waterGrad.addColorStop(0.6, 'rgba(10,18,42,0.88)');
    waterGrad.addColorStop(1,   'rgba(6,10,28,0.7)');
    ctx.fillStyle = waterGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 3; i++) {
      const phase = tileRng(i, 11, 0) * Math.PI * 2;
      const shimmerAlpha = 0.08 + Math.sin(now * (0.7 + i * 0.3) + phase) * 0.06;
      const shimmerX = cx - rx * 0.5 + tileRng(i, 11, 1) * rx;
      const shimmerY = cy - ry * 0.3 + tileRng(i, 11, 2) * ry * 0.6;
      ctx.globalAlpha = Math.max(0, shimmerAlpha);
      ctx.strokeStyle = 'rgba(140,180,240,0.8)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(shimmerX - 15, shimmerY);
      ctx.lineTo(shimmerX + 15, shimmerY);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    ctx.strokeStyle = 'rgba(60,80,140,0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // ── Stone path ──────────────────────────────────────────────────────────────

  private drawPath(): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = 'rgba(50,44,70,0.75)';
    ctx.lineWidth = 26;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.moveTo(PATH_POINTS[0].x, PATH_POINTS[0].y);
    for (let i = 1; i < PATH_POINTS.length - 1; i++) {
      const mx = (PATH_POINTS[i].x + PATH_POINTS[i + 1].x) / 2;
      const my = (PATH_POINTS[i].y + PATH_POINTS[i + 1].y) / 2;
      ctx.quadraticCurveTo(PATH_POINTS[i].x, PATH_POINTS[i].y, mx, my);
    }
    const last = PATH_POINTS[PATH_POINTS.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(70,62,95,0.35)';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(PATH_POINTS[0].x, PATH_POINTS[0].y);
    for (let i = 1; i < PATH_POINTS.length - 1; i++) {
      const mx = (PATH_POINTS[i].x + PATH_POINTS[i + 1].x) / 2;
      const my = (PATH_POINTS[i].y + PATH_POINTS[i + 1].y) / 2;
      ctx.quadraticCurveTo(PATH_POINTS[i].x, PATH_POINTS[i].y, mx, my);
    }
    ctx.lineTo(last.x, last.y);
    ctx.stroke();

    ctx.restore();
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

          let color: string;
          if      (colorR < 0.3) color = `rgba(180,200,255,${alpha.toFixed(2)})`;
          else if (colorR < 0.6) color = `rgba(255,240,200,${alpha.toFixed(2)})`;
          else                   color = `rgba(240,235,255,${alpha.toFixed(2)})`;

          if (isBright) {
            const seed  = tileRng(tx, ty, 8);
            const t     = now * 0.015 + seed;
            const pulse = 1 + Math.sin(now * 1.2 + seed) * 0.1;
            const outer = PLAYER_RADIUS * 1.1 * pulse;
            const inner = outer * 0.22;
            const rot   = t;

            const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, outer * 7);
            halo.addColorStop(0, color.replace(/[\d.]+\)$/, '0.18)'));
            halo.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(sx, sy, outer * 7, 0, Math.PI * 2);
            ctx.fill();

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

  // ── Rocks ───────────────────────────────────────────────────────────────────

  private drawRocks(): void {
    const ctx = this.ctx;
    for (const r of ROCKS) {
      ctx.save();
      ctx.translate(r.x, r.y);
      ctx.rotate(r.rot);
      ctx.fillStyle = 'rgba(28,24,44,0.92)';
      ctx.strokeStyle = 'rgba(60,52,88,0.5)';
      ctx.lineWidth = 1;
      ctx.shadowBlur = 4;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.ellipse(0, 0, r.rx, r.ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  // ── Trees ───────────────────────────────────────────────────────────────────

  private drawTrees(): void {
    const ctx = this.ctx;
    for (const t of TREES) {
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = 'rgba(20,40,20,0.4)';
      ctx.fillStyle = 'rgba(10,20,14,0.96)';
      ctx.beginPath();
      ctx.ellipse(t.x, t.y - t.h * 0.55, t.cr, t.cr * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(8,16,12,0.9)';
      ctx.beginPath();
      ctx.ellipse(t.x + t.cr * 0.3, t.y - t.h * 0.45, t.cr * 0.7, t.cr * 0.75, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(t.x - t.cr * 0.25, t.y - t.h * 0.48, t.cr * 0.65, t.cr * 0.7, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.fillStyle = 'rgba(16,12,24,0.95)';
      ctx.beginPath();
      ctx.roundRect(t.x - 4, t.y - t.h * 0.35, 8, t.h * 0.35, 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ── Bench ───────────────────────────────────────────────────────────────────

  private drawBench(): void {
    const ctx = this.ctx;
    const { x, y } = BENCH;
    ctx.save();
    ctx.fillStyle = 'rgba(22,18,36,0.9)';
    ctx.strokeStyle = 'rgba(50,42,72,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x - 22, y - 6, 44, 7, 2);
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(x - 22, y - 17, 44, 6, 2);
    ctx.fill(); ctx.stroke();
    for (const lx of [x - 16, x + 10]) {
      ctx.beginPath();
      ctx.roundRect(lx, y + 1, 5, 10, 1);
      ctx.fill();
    }
    ctx.restore();
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

  // ── Lanterns ─────────────────────────────────────────────────────────────────

  private drawLanterns(now: number): void {
    const ctx = this.ctx;
    for (let i = 0; i < LANTERNS.length; i++) {
      const { x, y } = LANTERNS[i];
      const flicker = 0.85 + Math.sin(now * (3.1 + i * 0.7) + i * 2.4) * 0.12;

      ctx.save();
      const groundGlow = ctx.createRadialGradient(x, y + 2, 0, x, y + 2, 60);
      groundGlow.addColorStop(0, `rgba(255,170,60,${(0.12 * flicker).toFixed(3)})`);
      groundGlow.addColorStop(1, 'rgba(255,140,40,0)');
      ctx.fillStyle = groundGlow;
      ctx.beginPath();
      ctx.arc(x, y + 2, 60, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(20,16,32,0.95)';
      ctx.beginPath();
      ctx.roundRect(x - 2, y, 4, 38, 1);
      ctx.fill();

      ctx.fillStyle = 'rgba(18,14,28,0.9)';
      ctx.strokeStyle = `rgba(200,140,60,${(0.5 * flicker).toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.shadowBlur = 8 * flicker;
      ctx.shadowColor = 'rgba(255,160,60,0.7)';
      ctx.beginPath();
      ctx.roundRect(x - 6, y - 14, 12, 14, 2);
      ctx.fill(); ctx.stroke();

      const innerGlow = ctx.createRadialGradient(x, y - 8, 0, x, y - 8, 10);
      innerGlow.addColorStop(0, `rgba(255,220,120,${(0.7 * flicker).toFixed(3)})`);
      innerGlow.addColorStop(1, 'rgba(255,160,60,0)');
      ctx.fillStyle = innerGlow;
      ctx.beginPath();
      ctx.arc(x, y - 8, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // ── Meteor orb (enhanced) ───────────────────────────────────────────────────

  private drawMeteor(meteor: MeteorEntity, isNearby: boolean, now: number): void {
    const ctx = this.ctx;
    const { x, y } = meteor;
    const col = METEOR_COLORS[meteor.category];

    const seed = tileRng(Math.round(x), Math.round(y), 99);
    const pulse = 1 + Math.sin(now * 2.2 + seed * 6) * 0.18;
    const r = (isNearby ? PLAYER_RADIUS * 1.5 : PLAYER_RADIUS * 1.1) * pulse;
    const glowR = r * (isNearby ? 7 : 5);

    const glow = ctx.createRadialGradient(x, y, 0, x, y, glowR);
    glow.addColorStop(0, col.glow);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, glowR, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.shadowBlur  = isNearby ? 28 : 14;
    ctx.shadowColor = col.shadow;
    ctx.fillStyle   = col.body;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (isNearby) {
      const ringR = PLAYER_RADIUS * 3.5 + Math.sin(now * 3) * 3;
      ctx.save();
      ctx.globalAlpha = 0.4 + Math.sin(now * 2.5) * 0.15;
      ctx.strokeStyle = col.shadow;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(x, y, ringR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      for (let i = 0; i < 4; i++) {
        const angle = now * 1.8 + (i * Math.PI / 2);
        const pr = PLAYER_RADIUS * 3 + Math.sin(now * 3 + i) * 4;
        const px = x + Math.cos(angle) * pr;
        const py = y + Math.sin(angle) * pr;
        ctx.save();
        ctx.globalAlpha = 0.5 + Math.sin(now * 4 + i * 1.5) * 0.3;
        ctx.fillStyle = col.body;
        ctx.shadowBlur = 4;
        ctx.shadowColor = col.shadow;
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  // ── Permanent star (✦ with slow pulse) ────────────────────────────────────

  private drawStar(x: number, y: number, now: number): void {
    const ctx  = this.ctx;
    const seed = tileRng(Math.round(x), Math.round(y), 0);
    const t    = now * 0.015 + seed;
    const pulse = 1 + Math.sin(now * 0.8 + seed) * 0.08;
    const outer = PLAYER_RADIUS * 1.2 * pulse;
    const inner = outer * 0.3;

    const halo = ctx.createRadialGradient(x, y, 0, x, y, outer * 8);
    halo.addColorStop(0, 'rgba(255,245,160,0.20)');
    halo.addColorStop(1, 'rgba(255,240,80,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(x, y, outer * 8, 0, Math.PI * 2);
    ctx.fill();

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

  // ── Local player — cloaked Wanderer ────────────────────────────────────────

  private drawPlayer(state: GameState, now: number, dirX: number, dirY: number): void {
    const ctx = this.ctx;
    const { x, y } = state.player;
    const isMoving = dirX !== 0 || dirY !== 0;

    const bob = isMoving
      ? Math.sin(now * 8) * 2.5
      : Math.sin(now * 1.5) * 1.5;

    // Ground shadow
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = 'rgba(0,0,0,0.9)';
    ctx.beginPath();
    ctx.ellipse(x, y + 14, 13, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(x, y + bob);
    if (dirX < 0) ctx.scale(-1, 1);

    // Cloak body
    ctx.shadowBlur  = 8;
    ctx.shadowColor = 'rgba(80,60,150,0.35)';
    ctx.fillStyle = 'rgba(10,7,28,0.97)';
    ctx.beginPath();
    ctx.moveTo(-9, -20);
    ctx.arc(0, -22, 9.5, Math.PI * 0.85, Math.PI * 0.15, false);
    ctx.quadraticCurveTo(12, -12, 11, 0);
    ctx.lineTo(-11, 0);
    ctx.quadraticCurveTo(-12, -12, -9, -20);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(110,90,180,0.18)';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Hood interior shadow
    ctx.fillStyle = 'rgba(4,3,14,0.6)';
    ctx.beginPath();
    ctx.arc(1, -24, 6, Math.PI * 0.9, Math.PI * 0.1, false);
    ctx.closePath();
    ctx.fill();

    // Walk feet
    if (isMoving) {
      const footSwing = Math.sin(now * 8);
      ctx.fillStyle = 'rgba(8,6,22,0.85)';
      ctx.beginPath();
      ctx.ellipse(-4 + footSwing * 3, 2, 4, 2.5, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(4 - footSwing * 3, 2, 4, 2.5, -0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Glowing orb
    const orbX = 11;
    const orbY = -10 + Math.sin(now * 2.4) * 1.8;

    const orbGrad = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, 16);
    orbGrad.addColorStop(0,    'rgba(190,225,255,0.72)');
    orbGrad.addColorStop(0.45, 'rgba(120,180,255,0.28)');
    orbGrad.addColorStop(1,    'rgba(70,130,220,0)');
    ctx.fillStyle = orbGrad;
    ctx.beginPath();
    ctx.arc(orbX, orbY, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur  = 14;
    ctx.shadowColor = 'rgba(180,215,255,0.95)';
    ctx.fillStyle   = 'rgba(235,248,255,0.97)';
    ctx.beginPath();
    ctx.arc(orbX, orbY, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // ── Interact prompt (two-line atmospheric) ─────────────────────────────────

  private drawInteractPrompt(line1: string, line2: string): void {
    const ctx = this.ctx;
    const cx = this.viewportW / 2;
    const cy = this.viewportH * 0.74;

    ctx.save();

    const w = 180;
    const h = 52;
    ctx.fillStyle = 'rgba(6,4,20,0.82)';
    ctx.strokeStyle = 'rgba(139,111,212,0.4)';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 16;
    ctx.shadowColor = 'rgba(139,111,212,0.3)';
    ctx.beginPath();
    roundRect(ctx, cx - w / 2, cy - h / 2, w, h, 10);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.font = '400 11px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(170,150,220,0.55)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(line2, cx, cy - 10);

    ctx.font = '700 13px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(200,185,255,0.95)';
    ctx.fillText(line1, cx, cy + 10);

    ctx.restore();
  }

  // ── World-entry fade overlay ────────────────────────────────────────────────

  private drawWorldFade(now: number): void {
    if (this.worldFadeStart === 0) this.worldFadeStart = now;
    const elapsed = now - this.worldFadeStart;
    const alpha = Math.max(0, 1 - elapsed / 1.5);
    if (alpha <= 0) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.viewportW, this.viewportH);
    ctx.restore();
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

type CategoryColors = { glow: string; shadow: string; body: string };
const METEOR_COLORS: Record<MeteorCategory, CategoryColors> = {
  burden:    { glow: 'rgba(100,60,180,0.22)',  shadow: 'rgba(120,80,200,0.75)',  body: 'rgba(160,120,230,0.93)' },
  moment:    { glow: 'rgba(200,100,180,0.22)', shadow: 'rgba(220,140,210,0.75)', body: 'rgba(235,175,225,0.93)' },
  hope:      { glow: 'rgba(60,160,220,0.22)',  shadow: 'rgba(80,190,240,0.75)',  body: 'rgba(130,215,250,0.93)' },
  gratitude: { glow: 'rgba(245,197,66,0.22)',  shadow: 'rgba(250,212,100,0.75)', body: 'rgba(252,228,130,0.93)' },
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
