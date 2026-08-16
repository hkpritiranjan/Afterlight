'use client';
import { useState } from 'react';
import type { MeteorCategory } from '../game/types';

const CATEGORIES: { value: MeteorCategory; label: string; color: string; icon: string }[] = [
  { value: 'burden',    label: 'Burden',    color: '#f472b6', icon: '◈' },
  { value: 'moment',    label: 'Moment',    color: '#50c8dc', icon: '◎' },
  { value: 'hope',      label: 'Hope',      color: '#4ade80', icon: '◉' },
  { value: 'gratitude', label: 'Gratitude', color: '#f5c542', icon: '✦' },
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

        <div style={modalHeader}>
          <span style={titleIcon}>✦</span>
          <div>
            <h2 style={title}>Release a meteor</h2>
            <p style={subtitle}>Your words travel anonymously through this sky.</p>
          </div>
        </div>

        <div style={categoryRow}>
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              style={{
                ...catBtn,
                borderColor: category === c.value ? c.color : c.color + '44',
                color: category === c.value ? '#0a0e1c' : c.color,
                background: category === c.value ? c.color : 'rgba(130,100,220,0.06)',
                boxShadow: category === c.value ? `0 0 14px ${c.color}55` : 'none',
              }}
            >
              <span style={{ marginRight: 4 }}>{c.icon}</span>{c.label}
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
            <span style={{ color: remaining < 20 ? '#f472b6' : 'var(--text-lo)', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
              {remaining}
            </span>
            <button
              type="submit"
              disabled={content.trim().length === 0}
              style={{ ...submitBtn, opacity: content.trim().length === 0 ? 0.4 : 1 }}
            >
              Release ✦
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: 'rgba(4,3,14,0.65)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 30,
  animation: 'fadeIn .2s ease',
  backdropFilter: 'blur(4px)',
};
const modal: React.CSSProperties = {
  background: 'rgba(8,6,28,0.92)',
  border: '1px solid var(--glass-border-hi)',
  borderRadius: 'var(--r-panel)',
  padding: '28px 32px',
  width: '100%', maxWidth: 480,
  position: 'relative',
  boxShadow: '0 8px 48px rgba(0,0,0,0.7), inset 0 1px 0 rgba(180,150,255,0.1)',
  animation: 'slideUp .3s cubic-bezier(0.16,1,0.3,1)',
};
const closeBtn: React.CSSProperties = {
  position: 'absolute', top: 16, right: 18,
  background: 'none', border: 'none', color: 'var(--text-lo)',
  fontSize: 22, cursor: 'pointer', lineHeight: 1,
};
const modalHeader: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 };
const titleIcon: React.CSSProperties = {
  fontSize: 22, color: 'var(--violet)',
  width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(139,111,212,0.15)', border: '1px solid rgba(139,111,212,0.3)',
  borderRadius: '50%', flexShrink: 0,
};
const title: React.CSSProperties = {
  margin: '0 0 3px', fontSize: 17, fontWeight: 700, color: 'var(--text-hi)',
  fontFamily: "'Palatino Linotype','Book Antiqua',Georgia,serif",
};
const subtitle: React.CSSProperties = { margin: 0, fontSize: 12, color: 'var(--text-lo)' };
const categoryRow: React.CSSProperties = {
  display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap',
};
const catBtn: React.CSSProperties = {
  padding: '5px 14px', borderRadius: 999, border: '1px solid',
  fontSize: 12, cursor: 'pointer', fontWeight: 600,
  transition: 'all .15s', display: 'flex', alignItems: 'center',
};
const textArea: React.CSSProperties = {
  width: '100%',
  background: 'rgba(130,100,220,0.07)',
  border: '1px solid var(--glass-border)',
  borderRadius: 10,
  color: 'var(--text-hi)', fontSize: 14, lineHeight: 1.65,
  padding: '12px 14px', resize: 'none', outline: 'none',
  fontFamily: 'inherit',
  transition: 'border-color .15s',
};
const footer: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12,
};
const submitBtn: React.CSSProperties = {
  background: 'var(--violet)',
  color: '#fff', border: 'none', borderRadius: 999,
  padding: '9px 24px', fontSize: 13, fontWeight: 700,
  cursor: 'pointer', letterSpacing: '0.04em',
  boxShadow: '0 0 20px rgba(139,111,212,0.4)',
  transition: 'opacity .15s',
};
