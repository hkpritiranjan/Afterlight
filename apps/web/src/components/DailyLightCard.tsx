'use client';

export default function DailyLightCard() {
  return (
    <div style={card}>
      <div style={header}>
        <span style={icon}>🌿</span>
        <span style={title}>Daily Light</span>
      </div>
      <p style={desc}>Acknowledge a meteor</p>
      <div style={footer}>
        <span style={reward}>+11</span>
        <button style={arrow} aria-label="Go">›</button>
      </div>
    </div>
  );
}

const card: React.CSSProperties = {
  position: 'fixed', bottom: 24, right: 20,
  width: 168,
  padding: '14px 16px',
  background: 'var(--glass-bg)',
  border: '1px solid var(--glass-border)',
  borderRadius: 'var(--r-panel)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  boxShadow: 'var(--glass-shadow)',
  zIndex: 10,
};
const header: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 };
const icon: React.CSSProperties = { fontSize: 14 };
const title: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: 'var(--sage)' };
const desc: React.CSSProperties = { fontSize: 11, color: 'var(--text-mid)', lineHeight: 1.4, marginBottom: 10 };
const footer: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const reward: React.CSSProperties = {
  fontSize: 13, fontWeight: 700, color: 'var(--gold)',
  background: 'rgba(245,197,66,0.12)',
  border: '1px solid rgba(245,197,66,0.25)',
  padding: '2px 9px', borderRadius: 999,
};
const arrow: React.CSSProperties = {
  background: 'none', border: 'none',
  color: 'var(--text-mid)', fontSize: 18,
  cursor: 'pointer', lineHeight: 1, padding: 0,
};
