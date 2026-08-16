'use client';
import type { StarEntity } from '../game/types';
import { MAP_WIDTH, MAP_HEIGHT } from '../game/constants';

function locationLabel(x: number, y: number): string {
  const col = x / MAP_WIDTH;
  const row = y / MAP_HEIGHT;
  const h = col < 0.35 ? 'West' : col < 0.65 ? 'Center' : 'East';
  const v = row < 0.35 ? 'North' : row < 0.65 ? 'Middle' : 'South';
  return `${v} · ${h}`;
}

interface Props {
  stars: StarEntity[];
  onClose: () => void;
}

export default function StarsPanel({ stars, onClose }: Props) {
  return (
    <div style={overlay}>
      <div style={panel}>
        <div style={header}>
          <div>
            <h2 style={title}>Stars</h2>
            <p style={subtitle}>Moments that stayed forever</p>
          </div>
          {stars.length > 0 && (
            <div style={countBadge}>{stars.length}</div>
          )}
          <button onClick={onClose} style={closeBtn} aria-label="Close">✕</button>
        </div>

        {stars.length === 0 ? (
          <div style={emptyWrap}>
            <span style={emptyIcon}>✦</span>
            <p style={emptyText}>No stars yet.</p>
            <p style={emptyHint}>Acknowledge a meteor to turn it into a star.</p>
          </div>
        ) : (
          <div style={grid}>
            {stars.map((star, i) => (
              <div key={star.starId} style={card}>
                <span style={cardIcon}>✦</span>
                <div style={cardBody}>
                  <span style={cardName}>Star {i + 1}</span>
                  <span style={cardLoc}>{locationLabel(star.x, star.y)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: 'rgba(4,3,14,0.55)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 20,
  backdropFilter: 'blur(5px)',
  WebkitBackdropFilter: 'blur(5px)',
  animation: 'fadeIn .2s ease',
};
const panel: React.CSSProperties = {
  width: '100%', maxWidth: 520,
  background: 'rgba(6,5,20,0.97)',
  border: '1px solid rgba(130,100,220,0.22)',
  borderRadius: 'var(--r-panel)',
  padding: '22px 24px',
  boxShadow: '0 16px 64px rgba(0,0,0,0.8), inset 0 1px 0 rgba(180,150,255,0.07)',
  animation: 'slideInRight .3s cubic-bezier(0.16,1,0.3,1)',
  maxHeight: '80vh', overflowY: 'auto',
};
const header: React.CSSProperties = {
  display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 20,
};
const title: React.CSSProperties = {
  margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-hi)',
};
const subtitle: React.CSSProperties = {
  margin: '3px 0 0', fontSize: 11, color: 'var(--text-lo)',
};
const countBadge: React.CSSProperties = {
  marginLeft: 'auto', marginTop: 2,
  background: 'rgba(245,197,66,0.12)',
  border: '1px solid rgba(245,197,66,0.3)',
  borderRadius: 20, padding: '2px 10px',
  fontSize: 12, fontWeight: 700, color: '#f5c542',
};
const closeBtn: React.CSSProperties = {
  marginTop: 2, background: 'none',
  border: '1px solid rgba(130,100,220,0.2)',
  borderRadius: 7, padding: '3px 10px',
  color: 'var(--text-lo)', fontSize: 12, cursor: 'pointer',
};
const emptyWrap: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  padding: '32px 0',
};
const emptyIcon: React.CSSProperties = { fontSize: 36, color: '#f5c542', opacity: 0.18 };
const emptyText: React.CSSProperties = {
  margin: '12px 0 4px', fontSize: 14, fontWeight: 600, color: 'var(--text-mid)',
};
const emptyHint: React.CSSProperties = {
  margin: 0, fontSize: 12, color: 'var(--text-lo)', textAlign: 'center',
};
const grid: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10,
};
const card: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12,
  background: 'rgba(139,111,212,0.06)',
  border: '1px solid rgba(130,100,220,0.14)',
  borderRadius: 10, padding: '12px 14px',
};
const cardIcon: React.CSSProperties = {
  fontSize: 18, color: '#f5c542',
  filter: 'drop-shadow(0 0 6px rgba(245,197,66,0.5))',
  flexShrink: 0,
};
const cardBody: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 2 };
const cardName: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: 'var(--text-hi)' };
const cardLoc: React.CSSProperties = { fontSize: 10, color: 'var(--text-lo)', letterSpacing: '0.04em' };
