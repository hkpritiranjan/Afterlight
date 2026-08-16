'use client';
import { useRef, useEffect } from 'react';
import type { MeteorEntity, StarEntity } from '../game/types';
import type { MapSnapshot } from '../hooks/useGame';
import { MAP_WIDTH, MAP_HEIGHT } from '../game/constants';

const CAT_COLOR: Record<string, string> = {
  burden: '#f472b6', moment: '#50c8dc', hope: '#4ade80', gratitude: '#f5c542',
};

interface Props {
  snapshot: MapSnapshot;
  meteors: MeteorEntity[];
  stars: StarEntity[];
  onClose: () => void;
}

export default function MapOverlay({ snapshot, meteors, stars, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const sx = (x: number) => (x / MAP_WIDTH)  * W;
    const sy = (y: number) => (y / MAP_HEIGHT) * H;

    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = 'rgba(4,3,20,1)';
    ctx.fillRect(0, 0, W, H);

    // Subtle grid
    ctx.strokeStyle = 'rgba(130,100,220,0.06)';
    ctx.lineWidth = 0.5;
    for (let i = 1; i < 12; i++) {
      const gx = (i / 12) * W;
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
    }
    for (let i = 1; i < 9; i++) {
      const gy = (i / 9) * H;
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    }

    // Vignette
    const vig = ctx.createRadialGradient(W/2, H/2, H * 0.2, W/2, H/2, H * 0.8);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);

    // Interaction zones
    ctx.textAlign = 'center';
    for (const zone of snapshot.zones) {
      const zx = sx(zone.x);
      const zy = sy(zone.y);
      ctx.beginPath();
      ctx.arc(zx, zy, 7, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(139,111,212,0.15)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(139,111,212,0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = 'rgba(200,185,248,0.5)';
      ctx.font = '9px system-ui, sans-serif';
      ctx.textBaseline = 'bottom';
      ctx.fillText(zone.label, zx, zy - 9);
    }

    // Stars (gold ✦)
    ctx.textBaseline = 'middle';
    for (const star of stars) {
      const stx = sx(star.x);
      const sty = sy(star.y);
      const g = ctx.createRadialGradient(stx, sty, 0, stx, sty, 8);
      g.addColorStop(0, 'rgba(245,197,66,0.3)');
      g.addColorStop(1, 'rgba(245,197,66,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(stx, sty, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(245,197,66,0.9)';
      ctx.font = '9px system-ui, sans-serif';
      ctx.fillText('✦', stx, sty);
    }

    // Meteors (category-colored glow dot)
    for (const m of meteors) {
      const mx = sx(m.x);
      const my = sy(m.y);
      const color = CAT_COLOR[m.category] ?? '#8b6fd4';
      const g2 = ctx.createRadialGradient(mx, my, 0, mx, my, 7);
      g2.addColorStop(0, color + 'bb');
      g2.addColorStop(1, color + '00');
      ctx.fillStyle = g2;
      ctx.beginPath(); ctx.arc(mx, my, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(mx, my, 2.5, 0, Math.PI * 2); ctx.fill();
    }

    // Remote players (teal dots)
    for (const rp of snapshot.remotePlayers) {
      const rx = sx(rp.x);
      const ry = sy(rp.y);
      ctx.fillStyle = 'rgba(80,200,220,0.75)';
      ctx.beginPath(); ctx.arc(rx, ry, 3, 0, Math.PI * 2); ctx.fill();
    }

    // Own player (violet ✦ + pulse ring)
    const px = sx(snapshot.playerPos.x);
    const py = sy(snapshot.playerPos.y);
    ctx.strokeStyle = 'rgba(139,111,212,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(px, py, 11, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(139,111,212,0.15)';
    ctx.beginPath(); ctx.arc(px, py, 18, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#c4a8ff';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('✦', px, py);

  }, [snapshot, meteors, stars]);

  const { remotePlayers, zones } = snapshot;

  return (
    <div style={overlay}>
      <div style={container}>
        <div style={header}>
          <h2 style={title}>World Map</h2>
          <div style={legend}>
            <Dot color="#c4a8ff" label="You" />
            <Dot color="#50c8dc" label="Others" />
            <Dot color="#f472b6" label="Meteors" />
            <Dot color="#f5c542" label="Stars" />
            <Dot color="#8b6fd4" faint label="Zones" />
          </div>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>

        <div style={canvasWrap}>
          <canvas ref={canvasRef} width={960} height={720} style={canvasStyle} />
        </div>

        <p style={foot}>
          {remotePlayers.length} player{remotePlayers.length !== 1 ? 's' : ''} nearby
          &ensp;·&ensp;
          {meteors.length} meteor{meteors.length !== 1 ? 's' : ''}
          &ensp;·&ensp;
          {stars.length} star{stars.length !== 1 ? 's' : ''}
          &ensp;·&ensp;
          {zones.length} zones
        </p>
      </div>
    </div>
  );
}

function Dot({ color, label, faint }: { color: string; label: string; faint?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, opacity: faint ? 0.45 : 1 }} />
      <span style={{ fontSize: 10, color: 'rgba(200,185,248,0.5)', fontWeight: 600, letterSpacing: '0.04em' }}>{label}</span>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: 'rgba(4,3,14,0.65)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 20,
  backdropFilter: 'blur(6px)',
  WebkitBackdropFilter: 'blur(6px)',
  animation: 'fadeIn .2s ease',
};
const container: React.CSSProperties = {
  width: '92%', maxWidth: 940,
  background: 'rgba(5,4,18,0.97)',
  border: '1px solid rgba(130,100,220,0.22)',
  borderRadius: 'var(--r-panel)',
  padding: '18px 22px 14px',
  boxShadow: '0 20px 80px rgba(0,0,0,0.85), inset 0 1px 0 rgba(180,150,255,0.06)',
};
const header: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14,
};
const title: React.CSSProperties = {
  margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
  textTransform: 'uppercase', color: 'var(--text-hi)',
};
const legend: React.CSSProperties = {
  display: 'flex', gap: 14, flex: 1,
};
const closeBtn: React.CSSProperties = {
  background: 'none', border: '1px solid rgba(130,100,220,0.2)',
  borderRadius: 7, padding: '3px 10px',
  color: 'var(--text-lo)', fontSize: 12, cursor: 'pointer',
};
const canvasWrap: React.CSSProperties = {
  width: '100%', aspectRatio: '4/3',
  borderRadius: 10, overflow: 'hidden',
  border: '1px solid rgba(130,100,220,0.14)',
};
const canvasStyle: React.CSSProperties = {
  width: '100%', height: '100%', display: 'block',
};
const foot: React.CSSProperties = {
  margin: '10px 0 0', fontSize: 10,
  color: 'rgba(130,100,220,0.4)', textAlign: 'center', letterSpacing: '0.04em',
};
