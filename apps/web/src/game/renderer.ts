import {
  MAP_WIDTH,
  MAP_HEIGHT,
  TILE_SIZE,
  PLAYER_RADIUS,
  INTERACTION_RADIUS,
} from './constants';
import type { GameState, Camera, RemotePlayer } from './types';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private dpr: number;
  viewportW = 0;
  viewportH = 0;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.dpr = typeof window !== 'undefined' ? (window.devicePixelRatio ?? 1) : 1;
  }

  resize(logicalW: number, logicalH: number): void {
    this.viewportW = logicalW;
    this.viewportH = logicalH;
    this.canvas.width = Math.floor(logicalW * this.dpr);
    this.canvas.height = Math.floor(logicalH * this.dpr);
    this.canvas.style.width = logicalW + 'px';
    this.canvas.style.height = logicalH + 'px';
  }

  render(state: GameState, camera: Camera, remotePlayers: ReadonlyMap<string, RemotePlayer>): void {
    const { ctx, dpr, viewportW, viewportH } = this;

    // Reset transform and apply DPR scale each frame
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // ── Background ────────────────────────────────────────────────────────
    const bg = ctx.createLinearGradient(0, 0, 0, viewportH);
    bg.addColorStop(0, '#070912');
    bg.addColorStop(1, '#0c1526');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, viewportW, viewportH);

    // ── World-space drawing (apply camera) ────────────────────────────────
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    this.drawWorldFloor(camera);
    this.drawStars(camera);
    this.drawWorldBorder();
    this.drawInteractionZones(state);

    for (const rp of remotePlayers.values()) {
      this.drawRemotePlayer(rp.x, rp.y);
    }

    this.drawPlayer(state);

    ctx.restore();

    // ── HUD (screen-space) ────────────────────────────────────────────────
    this.drawHUD(state, remotePlayers.size);

    if (state.nearbyZoneId) {
      this.drawInteractPrompt();
    }
  }

  private drawWorldFloor(camera: Camera): void {
    const ctx = this.ctx;

    // Fill world area with a slightly lighter shade
    ctx.fillStyle = '#090e1c';
    ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

    // Subtle tile grid — only draw tiles visible in viewport + margin
    const margin = TILE_SIZE * 2;
    const startX = Math.floor((camera.x - margin) / TILE_SIZE) * TILE_SIZE;
    const startY = Math.floor((camera.y - margin) / TILE_SIZE) * TILE_SIZE;
    const endX = camera.x + this.viewportW + margin;
    const endY = camera.y + this.viewportH + margin;

    ctx.strokeStyle = 'rgba(255,255,255,0.028)';
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

  private drawStars(camera: Camera): void {
    const ctx = this.ctx;
    const margin = TILE_SIZE * 4;
    const tStartX = Math.floor((camera.x - margin) / TILE_SIZE);
    const tStartY = Math.floor((camera.y - margin) / TILE_SIZE);
    const tEndX = tStartX + Math.ceil((this.viewportW + margin * 2) / TILE_SIZE);
    const tEndY = tStartY + Math.ceil((this.viewportH + margin * 2) / TILE_SIZE);

    for (let ty = tStartY; ty <= tEndY; ty++) {
      for (let tx = tStartX; tx <= tEndX; tx++) {
        if (tx < 0 || ty < 0 || tx * TILE_SIZE > MAP_WIDTH || ty * TILE_SIZE > MAP_HEIGHT) continue;
        const r0 = tileRng(tx, ty, 0);
        if (r0 > 0.91) {
          const sx = tx * TILE_SIZE + tileRng(tx, ty, 1) * TILE_SIZE;
          const sy = ty * TILE_SIZE + tileRng(tx, ty, 2) * TILE_SIZE;
          const alpha = 0.25 + tileRng(tx, ty, 3) * 0.55;
          const size = tileRng(tx, ty, 4) > 0.96 ? 2 : 1;
          ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
          ctx.fillRect(sx, sy, size, size);
        }
      }
    }
  }

  private drawWorldBorder(): void {
    const ctx = this.ctx;
    const b = 3;
    // Outer glow
    ctx.shadowBlur = 24;
    ctx.shadowColor = 'rgba(91,156,246,0.3)';
    ctx.strokeStyle = 'rgba(91,156,246,0.2)';
    ctx.lineWidth = b;
    ctx.strokeRect(b / 2, b / 2, MAP_WIDTH - b, MAP_HEIGHT - b);
    ctx.shadowBlur = 0;
  }

  private drawInteractionZones(state: GameState): void {
    const ctx = this.ctx;
    for (const zone of state.interactionZones) {
      const isNearby = zone.id === state.nearbyZoneId;
      const alpha = isNearby ? 0.55 : 0.2;
      const blur = isNearby ? 14 : 6;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowBlur = blur;
      ctx.shadowColor = 'rgba(245,197,66,0.9)';

      ctx.strokeStyle = 'rgba(245,197,66,0.85)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, INTERACTION_RADIUS * 0.65, 0, Math.PI * 2);
      ctx.stroke();

      // Centre dot
      ctx.fillStyle = 'rgba(245,197,66,0.6)';
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  private drawRemotePlayer(x: number, y: number): void {
    const ctx = this.ctx;

    // Soft glow
    const glow = ctx.createRadialGradient(x, y, 0, x, y, PLAYER_RADIUS * 3);
    glow.addColorStop(0, 'rgba(180,140,255,0.12)');
    glow.addColorStop(1, 'rgba(120,80,220,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, PLAYER_RADIUS * 3, 0, Math.PI * 2);
    ctx.fill();

    // Body — slightly dimmer, cooler hue than local player
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(180,140,255,0.6)';
    ctx.fillStyle = 'rgba(200,180,255,0.72)';
    ctx.beginPath();
    ctx.arc(x, y, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawPlayer(state: GameState): void {
    const ctx = this.ctx;
    const { x, y } = state.player;

    // Outer glow
    const glow = ctx.createRadialGradient(x, y, 0, x, y, PLAYER_RADIUS * 3);
    glow.addColorStop(0, 'rgba(180,220,255,0.18)');
    glow.addColorStop(1, 'rgba(91,156,246,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, PLAYER_RADIUS * 3, 0, Math.PI * 2);
    ctx.fill();

    // Player body
    ctx.save();
    ctx.shadowBlur = 16;
    ctx.shadowColor = 'rgba(150,200,255,0.9)';
    ctx.fillStyle = 'rgba(220,240,255,0.96)';
    ctx.beginPath();
    ctx.arc(x, y, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawHUD(state: GameState, remotePlayers: number): void {
    const ctx = this.ctx;
    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillText(
      `x:${Math.round(state.player.x)}  y:${Math.round(state.player.y)}  players:${remotePlayers + 1}`,
      14,
      this.viewportH - 14,
    );
  }

  private drawInteractPrompt(): void {
    const ctx = this.ctx;
    const text = 'Press E to interact';
    const cx = this.viewportW / 2;
    const cy = this.viewportH * 0.72;

    ctx.save();
    ctx.font = '600 13px -apple-system, system-ui, sans-serif';
    const w = ctx.measureText(text).width + 24;

    ctx.fillStyle = 'rgba(7,9,18,0.7)';
    ctx.beginPath();
    roundRect(ctx, cx - w / 2, cy - 14, w, 28, 6);
    ctx.fill();

    ctx.strokeStyle = 'rgba(245,197,66,0.45)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = 'rgba(245,197,66,0.9)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, cx, cy);
    ctx.restore();
  }
}

// ─── helpers ────────────────────────────────────────────────────────────────

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
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
