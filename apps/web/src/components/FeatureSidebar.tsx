'use client';

const FEATURES = [
  { icon: '✦',  name: 'Release',     tag: 'Share what you carry',       color: '#8b6fd4' },
  { icon: '◎',  name: 'Meteors',     tag: 'They travel anonymously',    color: '#50c8dc' },
  { icon: '◉',  name: 'Encounters',  tag: 'Find what others carry',     color: '#f472b6' },
  { icon: '❤',  name: 'Acknowledge', tag: 'Respond with kindness',      color: '#f5c542' },
  { icon: '★',  name: 'Stars',       tag: 'They stay forever',          color: '#f5c542' },
  { icon: '❧',  name: 'Garden',      tag: 'Grow your place with Light', color: '#4ade80' },
] as const;

interface Props {
  onRelease?: () => void;
  onGarden?: () => void;
}

export default function FeatureSidebar({ onRelease, onGarden }: Props) {
  const handlers: Partial<Record<string, () => void>> = {
    Release: onRelease,
    Garden: onGarden,
  };

  return (
    <div style={sidebar}>
      {FEATURES.map((f) => (
        <button
          key={f.name}
          style={row}
          onClick={handlers[f.name]}
          aria-label={f.name}
        >
          <span style={{ ...iconWrap, color: f.color, borderColor: f.color + '33' }}>
            {f.icon}
          </span>
          <div style={textWrap}>
            <span style={label}>{f.name}</span>
            <span style={tagline}>{f.tag}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

const sidebar: React.CSSProperties = {
  position: 'fixed', left: 20, top: '50%', transform: 'translateY(-50%)',
  display: 'flex', flexDirection: 'column',
  background: 'var(--glass-bg)',
  border: '1px solid var(--glass-border)',
  borderRadius: 'var(--r-panel)',
  backdropFilter: 'blur(20px) saturate(1.4)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
  boxShadow: 'var(--glass-shadow)',
  zIndex: 10,
  overflow: 'hidden',
};
const row: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12,
  padding: '11px 16px',
  background: 'none', border: 'none',
  borderBottom: '1px solid rgba(130,100,220,0.1)',
  cursor: 'pointer',
  transition: 'background .15s',
  textAlign: 'left',
  width: '100%',
};
const iconWrap: React.CSSProperties = {
  width: 28, height: 28, borderRadius: '50%',
  border: '1px solid',
  background: 'rgba(130,100,220,0.08)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 12, flexShrink: 0,
};
const textWrap: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 1 };
const label: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: 'var(--text-hi)' };
const tagline: React.CSSProperties = { fontSize: 10, color: 'var(--text-lo)', letterSpacing: '0.02em' };
