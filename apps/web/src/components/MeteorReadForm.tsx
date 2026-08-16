'use client';
import type { MeteorEntity, ResonanceResponseType } from '../game/types';

const RESPONSES: { value: ResonanceResponseType; emoji: string; label: string }[] = [
  { value: 'i_feel_this_too',         emoji: '💜', label: 'I feel this too.' },
  { value: 'you_are_not_alone',       emoji: '👥', label: "You're not alone." },
  { value: 'hope_things_get_lighter', emoji: '✦',  label: 'Thank you for sharing.' },
  { value: 'one_day_at_a_time',       emoji: '✨', label: 'Sending you light.' },
  { value: 'glad_you_shared',         emoji: '🌱', label: "I'm holding space for you." },
];

const CATEGORY_COLORS: Record<string, string> = {
  burden: '#f472b6', moment: '#50c8dc', hope: '#4ade80', gratitude: '#f5c542',
};
const CATEGORY_ICONS: Record<string, string> = {
  burden: '◈', moment: '◎', hope: '◉', gratitude: '✦',
};

interface Props {
  meteor: MeteorEntity;
  onAcknowledge: (meteorId: string, responseType: ResonanceResponseType) => void;
  onDismiss: () => void;
}

export default function MeteorReadForm({ meteor, onAcknowledge, onDismiss }: Props) {
  const accent = CATEGORY_COLORS[meteor.category] ?? '#8b6fd4';

  return (
    <div style={overlay}>
      <div style={panel}>
        <button onClick={onDismiss} style={closeBtn} aria-label="Pass by">Pass by</button>

        {/* Meteor content */}
        <div style={meteorCard}>
          <div style={catRow}>
            <span style={{ ...catDot, color: accent, borderColor: accent + '50' }}>
              {CATEGORY_ICONS[meteor.category]}
            </span>
            <span style={{ ...catLabel, color: accent }}>{meteor.category}</span>
          </div>
          <p style={content}>&ldquo;{meteor.content}&rdquo;</p>
        </div>

        {/* Ways to respond */}
        <div style={responsesHeader}>
          <span style={responseTitle}>Ways to Respond</span>
        </div>
        <div style={responseList}>
          {RESPONSES.map((r) => (
            <button
              key={r.value}
              onClick={() => onAcknowledge(meteor.meteorId, r.value)}
              style={responseBtn}
            >
              <span style={responseEmoji}>{r.emoji}</span>
              <span>{r.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: 'rgba(4,3,14,0.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 30,
  animation: 'fadeIn .2s ease',
  backdropFilter: 'blur(4px)',
};
const panel: React.CSSProperties = {
  background: 'rgba(8,6,28,0.92)',
  border: '1px solid var(--glass-border-hi)',
  borderRadius: 'var(--r-panel)',
  padding: '24px 28px',
  width: '100%', maxWidth: 420,
  position: 'relative',
  boxShadow: '0 8px 48px rgba(0,0,0,0.7), inset 0 1px 0 rgba(180,150,255,0.1)',
  animation: 'slideInRight .3s cubic-bezier(0.16,1,0.3,1)',
};
const closeBtn: React.CSSProperties = {
  position: 'absolute', top: 14, right: 16,
  background: 'none', border: 'none', color: 'var(--text-lo)',
  fontSize: 12, cursor: 'pointer', letterSpacing: '0.04em', fontWeight: 600,
};
const meteorCard: React.CSSProperties = {
  background: 'rgba(130,100,220,0.06)',
  border: '1px solid var(--glass-border)',
  borderRadius: 10, padding: '14px 16px', marginBottom: 16,
};
const catRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 };
const catDot: React.CSSProperties = {
  fontSize: 14, border: '1px solid',
  width: 24, height: 24, borderRadius: '50%',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(0,0,0,0.2)',
};
const catLabel: React.CSSProperties = { fontSize: 11, fontWeight: 700, textTransform: 'capitalize', letterSpacing: '0.08em' };
const content: React.CSSProperties = {
  color: 'var(--text-hi)', fontSize: 15, lineHeight: 1.7,
  margin: 0, fontStyle: 'italic',
  fontFamily: "'Palatino Linotype','Book Antiqua',Georgia,serif",
};
const responsesHeader: React.CSSProperties = {
  borderBottom: '1px solid var(--glass-border)', paddingBottom: 8, marginBottom: 8,
};
const responseTitle: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.12em', color: 'var(--text-lo)',
};
const responseList: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4 };
const responseBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  background: 'rgba(130,100,220,0.07)',
  border: '1px solid var(--glass-border)',
  borderRadius: 10, color: 'var(--text-mid)',
  padding: '10px 14px', textAlign: 'left',
  fontSize: 13, cursor: 'pointer',
  transition: 'background .12s, border-color .12s',
  width: '100%',
};
const responseEmoji: React.CSSProperties = { fontSize: 15, minWidth: 20 };
