'use client';

interface Props { message: string; }

export default function NotificationToast({ message }: Props) {
  return (
    <div style={toast}>
      <span style={dot}>✦</span>
      {message}
    </div>
  );
}

const toast: React.CSSProperties = {
  position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
  background: 'rgba(14,18,36,0.92)',
  border: '1px solid rgba(91,156,246,0.3)',
  borderRadius: 24, padding: '9px 22px',
  color: '#c8dcf8', fontSize: 14, fontWeight: 500,
  display: 'flex', alignItems: 'center', gap: 8,
  boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
  zIndex: 20, whiteSpace: 'nowrap',
  animation: 'fadeInDown .3s ease',
};
const dot: React.CSSProperties = { color: '#f5c542', fontSize: 11 };
