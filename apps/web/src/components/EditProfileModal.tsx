'use client';
import { useState, useEffect, useRef } from 'react';

const STORAGE_KEY = 'afterlight:playerName';
const MAX_LEN = 24;

export function loadPlayerName(): string {
  try { return localStorage.getItem(STORAGE_KEY) ?? ''; } catch { return ''; }
}

interface Props {
  currentName: string;
  onSave: (name: string) => void;
  onClose: () => void;
}

export default function EditProfileModal({ currentName, onSave, onClose }: Props) {
  const [value, setValue] = useState(currentName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleSave() {
    const trimmed = value.trim() || 'Wanderer';
    try { localStorage.setItem(STORAGE_KEY, trimmed); } catch { /* noop */ }
    onSave(trimmed);
    onClose();
  }

  return (
    <div style={overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modal}>
        <div style={header}>
          <div style={avatarPreview}>✦</div>
          <div>
            <h2 style={title}>Your Identity</h2>
            <p style={subtitle}>Only visible to you</p>
          </div>
        </div>

        <label style={labelStyle} htmlFor="player-name">Display name</label>
        <input
          ref={inputRef}
          id="player-name"
          style={input}
          value={value}
          maxLength={MAX_LEN}
          placeholder="Wanderer"
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
        />
        <p style={hint}>{MAX_LEN - value.length} characters remaining</p>

        <div style={actions}>
          <button style={cancelBtn} onClick={onClose}>Cancel</button>
          <button style={saveBtn} onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: 'rgba(4,3,14,0.6)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 30,
  backdropFilter: 'blur(5px)',
  WebkitBackdropFilter: 'blur(5px)',
  animation: 'fadeIn .18s ease',
};
const modal: React.CSSProperties = {
  width: '100%', maxWidth: 360,
  background: 'rgba(6,5,20,0.97)',
  border: '1px solid rgba(130,100,220,0.25)',
  borderRadius: 'var(--r-panel)',
  padding: '24px',
  boxShadow: '0 16px 64px rgba(0,0,0,0.85), inset 0 1px 0 rgba(180,150,255,0.08)',
  animation: 'slideUp .28s cubic-bezier(0.16,1,0.3,1)',
};
const header: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
};
const avatarPreview: React.CSSProperties = {
  width: 44, height: 44, borderRadius: '50%',
  border: '1px solid rgba(139,111,212,0.4)',
  background: 'rgba(139,111,212,0.15)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 18, color: 'var(--violet)', flexShrink: 0,
};
const title: React.CSSProperties = { margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-hi)' };
const subtitle: React.CSSProperties = { margin: '3px 0 0', fontSize: 11, color: 'var(--text-lo)' };
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: 'var(--text-lo)', marginBottom: 6,
};
const input: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(130,100,220,0.08)',
  border: '1px solid rgba(130,100,220,0.25)',
  borderRadius: 8, padding: '10px 12px',
  color: 'var(--text-hi)', fontSize: 14,
  fontFamily: "'Palatino Linotype','Book Antiqua',Georgia,serif",
  outline: 'none',
};
const hint: React.CSSProperties = {
  margin: '5px 0 16px', fontSize: 10, color: 'var(--text-lo)', textAlign: 'right',
};
const actions: React.CSSProperties = { display: 'flex', gap: 8, justifyContent: 'flex-end' };
const cancelBtn: React.CSSProperties = {
  background: 'none', border: '1px solid rgba(130,100,220,0.2)',
  borderRadius: 8, padding: '8px 16px',
  color: 'var(--text-lo)', fontSize: 13, cursor: 'pointer',
};
const saveBtn: React.CSSProperties = {
  background: 'rgba(139,111,212,0.2)',
  border: '1px solid rgba(139,111,212,0.5)',
  borderRadius: 8, padding: '8px 20px',
  color: 'var(--violet)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
};
