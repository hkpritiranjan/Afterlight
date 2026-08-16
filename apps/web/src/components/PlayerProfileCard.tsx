'use client';

function progressionTitle(light: number): string {
  if (light >= 400) return 'Luminous';
  if (light >= 150) return 'Star Weaver';
  if (light >= 50)  return 'Lantern Keeper';
  if (light >= 10)  return 'Light Bearer';
  return 'Wanderer';
}

interface Props {
  playerName: string;
  lightBalance: number;
  onClick: () => void;
}

export default function PlayerProfileCard({ playerName, lightBalance, onClick }: Props) {
  const title = progressionTitle(lightBalance);

  return (
    <button style={card} onClick={onClick} title="Edit profile" aria-label="Edit profile">
      <div style={avatarWrap}>
        <div style={avatar}>✦</div>
      </div>
      <div style={info}>
        <div style={nameStyle}>{playerName || 'Wanderer'}</div>
        <div style={sub}>{title}</div>
        <div style={lightRow}>
          <span style={star}>✦</span>
          <span style={lightVal}>{lightBalance} Light</span>
        </div>
      </div>
      <div style={editHint}>✎</div>
    </button>
  );
}

const card: React.CSSProperties = {
  position: 'fixed', top: 20, left: 20,
  display: 'flex', alignItems: 'center', gap: 12,
  padding: '12px 16px',
  background: 'var(--glass-bg)',
  border: '1px solid var(--glass-border)',
  borderRadius: 'var(--r-panel)',
  backdropFilter: 'blur(20px) saturate(1.4)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
  boxShadow: 'var(--glass-shadow)',
  zIndex: 10,
  minWidth: 180,
  cursor: 'pointer',
  textAlign: 'left',
};
const avatarWrap: React.CSSProperties = {
  width: 40, height: 40,
  borderRadius: '50%',
  border: '1px solid var(--glass-border-hi)',
  background: 'rgba(139,111,212,0.15)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
};
const avatar: React.CSSProperties = { fontSize: 16, color: 'var(--violet)' };
const info: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 2, flex: 1 };
const nameStyle: React.CSSProperties = {
  fontSize: 14, fontWeight: 700, color: 'var(--text-hi)',
  fontFamily: "'Palatino Linotype', 'Book Antiqua', Georgia, serif",
};
const sub: React.CSSProperties = {
  fontSize: 10, color: 'var(--text-lo)',
  letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600,
};
const lightRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 };
const star: React.CSSProperties = { fontSize: 10, color: 'var(--gold)' };
const lightVal: React.CSSProperties = { fontSize: 12, color: 'var(--gold)', fontWeight: 600 };
const editHint: React.CSSProperties = {
  fontSize: 12, color: 'var(--text-lo)', opacity: 0.5,
  alignSelf: 'flex-start', marginTop: 2,
};
