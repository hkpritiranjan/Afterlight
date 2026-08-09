'use client';
import type { MeteorEntity, ResonanceResponseType } from '../game/types';

const RESPONSES: { value: ResonanceResponseType; label: string }[] = [
  { value: 'i_feel_this_too',         label: 'I feel this too.' },
  { value: 'you_are_not_alone',       label: "You're not alone." },
  { value: 'hope_things_get_lighter', label: 'I hope things get lighter.' },
  { value: 'one_day_at_a_time',       label: 'One day at a time.' },
  { value: 'glad_you_shared',         label: "I'm glad you shared this." },
];

const CATEGORY_COLORS: Record<string, string> = {
  burden: '#e05050', moment: '#50c8dc', hope: '#64dc78', gratitude: '#f5c542',
};

interface Props {
  meteor: MeteorEntity;
  onAcknowledge: (meteorId: string, responseType: ResonanceResponseType) => void;
  onDismiss: () => void;
}

export default function MeteorReadForm({ meteor, onAcknowledge, onDismiss }: Props) {
  const accentColor = CATEGORY_COLORS[meteor.category] ?? '#5b9cf6';

  return (
    <div style={overlay}>
      <div style={modal}>
        <button onClick={onDismiss} style={closeBtn} aria-label="Pass by">Pass by</button>
        <span style={{ ...categoryTag, borderColor: accentColor, color: accentColor }}>
          {meteor.category}
        </span>
        <p style={content}>{meteor.content}</p>
        <p style={prompt}>How do you want to respond?</p>
        <div style={responseList}>
          {RESPONSES.map((r) => (
            <button
              key={r.value}
              onClick={() => onAcknowledge(meteor.meteorId, r.value)}
              style={responseBtn}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: 'rgba(7,9,18,0.75)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 10,
};
const modal: React.CSSProperties = {
  background: 'rgba(14,18,36,0.97)',
  border: '1px solid rgba(91,156,246,0.2)',
  borderRadius: 12,
  padding: '28px 32px',
  width: '100%', maxWidth: 420,
  position: 'relative',
  boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
};
const closeBtn: React.CSSProperties = {
  position: 'absolute', top: 14, right: 16,
  background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
  fontSize: 13, cursor: 'pointer',
};
const categoryTag: React.CSSProperties = {
  display: 'inline-block',
  border: '1px solid', borderRadius: 20,
  padding: '2px 12px', fontSize: 12, fontWeight: 600,
  textTransform: 'capitalize', marginBottom: 14,
};
const content: React.CSSProperties = {
  color: '#d8eaff', fontSize: 15, lineHeight: 1.7,
  margin: '0 0 20px', fontStyle: 'italic',
};
const prompt: React.CSSProperties = {
  color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: '0 0 10px',
};
const responseList: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 8,
};
const responseBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, color: '#c8dcf8',
  padding: '10px 14px', textAlign: 'left',
  fontSize: 14, cursor: 'pointer',
  transition: 'background .12s',
};
