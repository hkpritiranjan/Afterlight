'use client';
import { useState } from 'react';
import type { MeteorCategory, ResonanceResponseType } from '../game/types';

const CATEGORIES: { value: MeteorCategory; label: string; color: string }[] = [
  { value: 'burden',    label: 'Burden',    color: '#e05050' },
  { value: 'moment',    label: 'Moment',    color: '#50c8dc' },
  { value: 'hope',      label: 'Hope',      color: '#64dc78' },
  { value: 'gratitude', label: 'Gratitude', color: '#f5c542' },
];

interface Props {
  onSubmit: (category: MeteorCategory, content: string) => void;
  onDismiss: () => void;
}

export default function MeteorCreateForm({ onSubmit, onDismiss }: Props) {
  const [category, setCategory] = useState<MeteorCategory>('moment');
  const [content, setContent]   = useState('');
  const remaining = 280 - content.length;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (content.trim().length === 0) return;
    onSubmit(category, content.trim());
  }

  return (
    <div style={overlay}>
      <div style={modal}>
        <button onClick={onDismiss} style={closeBtn} aria-label="Close">×</button>
        <h2 style={title}>Release a meteor</h2>
        <p style={subtitle}>Your words travel anonymously through this sky.</p>

        <div style={categoryRow}>
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              style={{
                ...catBtn,
                borderColor: c.color,
                color: category === c.value ? '#0a0e1c' : c.color,
                background: category === c.value ? c.color : 'transparent',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 280))}
            placeholder="What are you carrying?"
            rows={4}
            style={textArea}
            autoFocus
          />
          <div style={footer}>
            <span style={{ color: remaining < 20 ? '#e05050' : 'rgba(255,255,255,0.35)', fontSize: 12 }}>
              {remaining}
            </span>
            <button
              type="submit"
              disabled={content.trim().length === 0}
              style={{ ...submitBtn, opacity: content.trim().length === 0 ? 0.4 : 1 }}
            >
              Release
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: 'rgba(7,9,18,0.7)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 10,
};
const modal: React.CSSProperties = {
  background: 'rgba(14,18,36,0.97)',
  border: '1px solid rgba(91,156,246,0.2)',
  borderRadius: 12,
  padding: '28px 32px',
  width: '100%', maxWidth: 460,
  position: 'relative',
  boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
};
const closeBtn: React.CSSProperties = {
  position: 'absolute', top: 14, right: 18,
  background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
  fontSize: 22, cursor: 'pointer', lineHeight: 1,
};
const title: React.CSSProperties = {
  margin: '0 0 4px', fontSize: 18, fontWeight: 600, color: '#d0e8ff',
};
const subtitle: React.CSSProperties = {
  margin: '0 0 20px', fontSize: 13, color: 'rgba(255,255,255,0.35)',
};
const categoryRow: React.CSSProperties = {
  display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap',
};
const catBtn: React.CSSProperties = {
  padding: '5px 14px', borderRadius: 20, border: '1px solid',
  fontSize: 13, cursor: 'pointer', fontWeight: 500, transition: 'all .15s',
};
const textArea: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
  color: '#d8eaff', fontSize: 14, lineHeight: 1.6,
  padding: '10px 12px', resize: 'none', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
};
const footer: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10,
};
const submitBtn: React.CSSProperties = {
  background: 'rgba(91,156,246,0.85)', color: '#fff',
  border: 'none', borderRadius: 8, padding: '8px 22px',
  fontSize: 14, fontWeight: 600, cursor: 'pointer',
};
