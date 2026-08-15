'use client';

// SVG icon paths (Lucide-style, 24×24 viewBox)
const ICONS = {
  social: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  journal: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
  write: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19l7-7 3 3-7 7-3-3z"/>
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
      <path d="M2 2l7.586 7.586"/>
      <circle cx="11" cy="11" r="2"/>
    </svg>
  ),
  settings: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
};

interface Props {
  onJournal?: () => void;
  onWrite?: () => void;
}

export default function NavIconBar({ onJournal, onWrite }: Props) {
  const handlers: Partial<Record<string, () => void>> = {
    journal: onJournal,
    write: onWrite,
  };

  return (
    <div style={bar}>
      {(['social', 'journal', 'write', 'settings'] as const).map((key) => (
        <button key={key} style={btn} onClick={handlers[key]} aria-label={key} title={key}>
          {ICONS[key]}
        </button>
      ))}
    </div>
  );
}

const bar: React.CSSProperties = {
  position: 'fixed', top: 20, right: 20,
  display: 'flex', alignItems: 'center', gap: 2,
  padding: '6px 8px',
  background: 'var(--glass-bg)',
  border: '1px solid var(--glass-border)',
  borderRadius: 'var(--r-pill)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  boxShadow: 'var(--glass-shadow)',
  zIndex: 10,
};
const btn: React.CSSProperties = {
  width: 36, height: 36,
  background: 'none', border: 'none',
  borderRadius: 'var(--r-pill)',
  color: 'var(--text-mid)',
  cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'color .15s, background .15s',
};
