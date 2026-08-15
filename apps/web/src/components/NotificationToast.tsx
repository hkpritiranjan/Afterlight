'use client';

interface Props { message: string; }

export default function NotificationToast({ message }: Props) {
  const lines = message.split('/').map((s) => s.trim()).filter(Boolean);

  return (
    <div style={toast}>
      <div style={iconWrap}>
        <span style={star}>✦</span>
      </div>
      <div>
        {lines.map((line, i) => (
          <p key={i} style={i === 0 ? line1 : line2}>{line}</p>
        ))}
      </div>
    </div>
  );
}

const toast: React.CSSProperties = {
  position: 'fixed', bottom: 24, left: 24,
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '12px 18px',
  background: 'var(--glass-bg)',
  border: '1px solid rgba(245,197,66,0.28)',
  borderRadius: 'var(--r-panel)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  boxShadow: '0 4px 32px rgba(0,0,0,0.45), 0 0 20px rgba(245,197,66,0.08)',
  zIndex: 20,
  animation: 'slideUp .35s cubic-bezier(0.16,1,0.3,1)',
  maxWidth: 280,
};
const iconWrap: React.CSSProperties = {
  width: 32, height: 32,
  background: 'rgba(245,197,66,0.12)',
  border: '1px solid rgba(245,197,66,0.25)',
  borderRadius: '50%',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
};
const star: React.CSSProperties = { fontSize: 13, color: 'var(--gold)' };
const line1: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: 'var(--text-hi)', lineHeight: 1.3, marginBottom: 2 };
const line2: React.CSSProperties = { fontSize: 11, color: 'var(--text-lo)', lineHeight: 1.3 };
