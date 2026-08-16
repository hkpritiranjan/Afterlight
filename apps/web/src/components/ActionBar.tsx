'use client';

interface Props {
  onMap: () => void;
  onRelease: () => void;
  onGarden: () => void;
}

export default function ActionBar({ onMap, onRelease, onGarden }: Props) {
  return (
    <div style={bar}>
      {/* Map */}
      <button style={sideBtn} onClick={onMap} aria-label="Map" title="Map">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
          <line x1="9" y1="3" x2="9" y2="18"/>
          <line x1="15" y1="6" x2="15" y2="21"/>
        </svg>
        <span style={btnLabel}>Map</span>
      </button>

      {/* Release — primary CTA */}
      <div style={releasePillWrap}>
        <button style={releaseBtn} onClick={onRelease} aria-label="Release a meteor">
          <span style={releasePulse} />
          <span style={sparkle}>✦</span>
        </button>
        <span style={releaseLabel}>Release</span>
      </div>

      {/* Garden */}
      <button style={sideBtn} onClick={onGarden} aria-label="Garden" title="Garden">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22V12"/>
          <path d="M5 12H2a10 10 0 0 0 20 0h-3"/>
          <path d="M2 12C2 6.48 6.48 2 12 2s10 4.48 10 10"/>
          <path d="M7 9l5 3 5-3"/>
        </svg>
        <span style={btnLabel}>Garden</span>
      </button>
    </div>
  );
}

const bar: React.CSSProperties = {
  position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '10px 20px',
  background: 'var(--glass-bg)',
  border: '1px solid var(--glass-border)',
  borderRadius: 'var(--r-pill)',
  backdropFilter: 'blur(20px) saturate(1.4)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
  boxShadow: 'var(--glass-shadow)',
  zIndex: 10,
};
const sideBtn: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
  background: 'none', border: 'none',
  color: 'var(--text-mid)', cursor: 'pointer',
  padding: '4px 12px',
  borderRadius: 10,
  transition: 'color .15s',
};
const btnLabel: React.CSSProperties = { fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' };
const releasePillWrap: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
  margin: '0 8px',
};
const releaseBtn: React.CSSProperties = {
  width: 52, height: 52,
  borderRadius: '50%',
  background: 'rgba(139,111,212,0.25)',
  border: '2px solid var(--violet)',
  color: 'var(--text-hi)',
  cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  position: 'relative',
  boxShadow: '0 0 20px rgba(139,111,212,0.4)',
  transition: 'box-shadow .2s',
};
const releasePulse: React.CSSProperties = {
  position: 'absolute', inset: -6,
  borderRadius: '50%',
  border: '2px solid rgba(139,111,212,0.45)',
  animation: 'pulseRing 2.5s ease-out infinite',
  pointerEvents: 'none',
};
const sparkle: React.CSSProperties = { fontSize: 20, color: 'var(--violet)' };
const releaseLabel: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, color: 'var(--violet)',
  letterSpacing: '0.08em', textTransform: 'uppercase',
};
