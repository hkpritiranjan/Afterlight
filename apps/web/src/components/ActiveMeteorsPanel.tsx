'use client';
import type { MeteorEntity } from '../game/types';

const CATEGORY_COLORS: Record<string, string> = {
  burden: '#f472b6', moment: '#50c8dc', hope: '#4ade80', gratitude: '#f5c542',
};

const CATEGORY_ICONS: Record<string, string> = {
  burden: '◈', moment: '◎', hope: '◉', gratitude: '✦',
};

function timeAgo(now: number, index: number): string {
  const mins = [32, 48, 73][index % 3];
  return `${mins}m`;
}

interface Props {
  meteors: MeteorEntity[];
}

export default function ActiveMeteorsPanel({ meteors }: Props) {
  const shown = meteors.slice(0, 3);
  const now = Date.now();

  return (
    <div style={panel}>
      <div style={panelHeader}>
        <span style={panelTitle}>Active Meteors Nearby</span>
        <span style={count}>{meteors.length}</span>
      </div>

      {shown.length === 0 ? (
        <p style={empty}>The sky is quiet for now.</p>
      ) : (
        <div style={list}>
          {shown.map((m, i) => (
            <div key={m.meteorId} style={item}>
              <span style={{ ...dot, color: CATEGORY_COLORS[m.category], borderColor: CATEGORY_COLORS[m.category] + '40' }}>
                {CATEGORY_ICONS[m.category]}
              </span>
              <div style={itemText}>
                <p style={excerpt}>{m.content.slice(0, 60)}{m.content.length > 60 ? '…' : ''}</p>
              </div>
              <span style={time}>{timeAgo(now, i)}</span>
            </div>
          ))}
        </div>
      )}

      {meteors.length > 3 && (
        <button style={viewAll}>View All ({meteors.length})</button>
      )}
    </div>
  );
}

const panel: React.CSSProperties = {
  position: 'fixed', top: 72, right: 20,
  width: 260,
  background: 'var(--glass-bg)',
  border: '1px solid var(--glass-border)',
  borderRadius: 'var(--r-panel)',
  backdropFilter: 'blur(20px) saturate(1.4)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
  boxShadow: 'var(--glass-shadow)',
  zIndex: 10,
  overflow: 'hidden',
  animation: 'fadeIn .3s ease',
};
const panelHeader: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '12px 16px 8px',
  borderBottom: '1px solid rgba(130,100,220,0.12)',
};
const panelTitle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.1em', color: 'var(--text-lo)',
};
const count: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, color: 'var(--violet)',
  background: 'rgba(139,111,212,0.15)',
  border: '1px solid rgba(139,111,212,0.25)',
  padding: '1px 7px', borderRadius: 999,
};
const list: React.CSSProperties = { display: 'flex', flexDirection: 'column' };
const item: React.CSSProperties = {
  display: 'flex', alignItems: 'flex-start', gap: 10,
  padding: '10px 16px',
  borderBottom: '1px solid rgba(130,100,220,0.08)',
};
const dot: React.CSSProperties = {
  fontSize: 13, border: '1px solid',
  width: 26, height: 26, borderRadius: '50%',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0, marginTop: 1,
  background: 'rgba(130,100,220,0.07)',
};
const itemText: React.CSSProperties = { flex: 1, minWidth: 0 };
const excerpt: React.CSSProperties = {
  fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.5,
  overflow: 'hidden', display: '-webkit-box',
  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
} as React.CSSProperties;
const time: React.CSSProperties = {
  fontSize: 10, color: 'var(--text-lo)', whiteSpace: 'nowrap', marginTop: 2,
};
const empty: React.CSSProperties = {
  padding: '16px', fontSize: 12, color: 'var(--text-lo)',
  textAlign: 'center', fontStyle: 'italic',
};
const viewAll: React.CSSProperties = {
  width: '100%', padding: '10px', background: 'none',
  border: 'none', borderTop: '1px solid rgba(130,100,220,0.12)',
  color: 'var(--violet)', fontSize: 12, fontWeight: 600,
  cursor: 'pointer', letterSpacing: '0.04em',
};
