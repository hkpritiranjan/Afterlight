'use client';

export default function Compass() {
  return (
    <div style={wrap}>
      <div style={row}>
        <span style={cardinal}>W</span>
        <span style={divider}>·</span>
        <span style={{ ...cardinal, color: 'var(--text-hi)', fontWeight: 700 }}>N</span>
        <span style={divider}>·</span>
        <span style={cardinal}>E</span>
      </div>
      <div style={line}>
        <div style={notch} />
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = {
  position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
  padding: '10px 22px 8px',
  background: 'var(--glass-bg)',
  border: '1px solid var(--glass-border)',
  borderRadius: 'var(--r-pill)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  zIndex: 10,
  userSelect: 'none',
};
const row: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
};
const cardinal: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: 'var(--text-mid)',
  letterSpacing: '0.1em', textTransform: 'uppercase',
};
const divider: React.CSSProperties = { color: 'var(--text-lo)', fontSize: 10 };
const line: React.CSSProperties = {
  width: 56, height: 1,
  background: 'linear-gradient(90deg, transparent, var(--glass-border-hi), transparent)',
  position: 'relative',
};
const notch: React.CSSProperties = {
  position: 'absolute', top: -2, left: '50%', transform: 'translateX(-50%)',
  width: 5, height: 5,
  borderRadius: '50%',
  background: 'var(--violet)',
};
