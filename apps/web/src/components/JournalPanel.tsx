'use client';
import { useState, useEffect } from 'react';
import type { MeteorCategory } from '../game/types';

export interface JournalEntry {
  id: string;
  category: MeteorCategory;
  content: string;
  timestamp: number;
}

const STORAGE_KEY = 'afterlight:journal';

export function saveJournalEntry(category: MeteorCategory, content: string): void {
  try {
    const prev: JournalEntry[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    const entry: JournalEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      category,
      content,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([entry, ...prev].slice(0, 100)));
  } catch { /* storage unavailable */ }
}

function timeAgo(ts: number): string {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

const CAT_COLOR: Record<MeteorCategory, string> = {
  burden: '#f472b6', moment: '#50c8dc', hope: '#4ade80', gratitude: '#f5c542',
};
const CAT_ICON: Record<MeteorCategory, string> = {
  burden: '◈', moment: '◎', hope: '◉', gratitude: '✦',
};

interface Props {
  onClose: () => void;
}

export default function JournalPanel({ onClose }: Props) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);

  useEffect(() => {
    try {
      setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'));
    } catch { setEntries([]); }
  }, []);

  return (
    <div style={overlay}>
      <div style={panel}>
        <div style={header}>
          <div>
            <h2 style={title}>Journal</h2>
            <p style={subtitle}>What you&apos;ve released into the world</p>
          </div>
          {entries.length > 0 && <div style={badge}>{entries.length}</div>}
          <button onClick={onClose} style={closeBtn} aria-label="Close">✕</button>
        </div>

        {entries.length === 0 ? (
          <div style={emptyWrap}>
            <span style={emptyIcon}>◈</span>
            <p style={emptyText}>Nothing released yet.</p>
            <p style={emptyHint}>Press Release (✦) or keyboard E near a zone to share something.</p>

          </div>
        ) : (
          <div style={list}>
            {entries.map((e) => {
              const color = CAT_COLOR[e.category];
              return (
                <div key={e.id} style={card}>
                  <div style={cardTop}>
                    <span style={{ ...catChip, color, borderColor: color + '40', background: color + '18' }}>
                      {CAT_ICON[e.category]} {e.category}
                    </span>
                    <span style={timeLabel}>{timeAgo(e.timestamp)}</span>
                  </div>
                  <p style={cardContent}>{e.content}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: 'rgba(4,3,14,0.55)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 20,
  backdropFilter: 'blur(5px)',
  WebkitBackdropFilter: 'blur(5px)',
  animation: 'fadeIn .2s ease',
};
const panel: React.CSSProperties = {
  width: '100%', maxWidth: 480,
  background: 'rgba(6,5,20,0.97)',
  border: '1px solid rgba(130,100,220,0.22)',
  borderRadius: 'var(--r-panel)',
  padding: '22px 24px',
  boxShadow: '0 16px 64px rgba(0,0,0,0.8), inset 0 1px 0 rgba(180,150,255,0.07)',
  animation: 'slideInRight .3s cubic-bezier(0.16,1,0.3,1)',
  maxHeight: '80vh', overflowY: 'auto',
};
const header: React.CSSProperties = {
  display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 20,
};
const title: React.CSSProperties = {
  margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-hi)',
};
const subtitle: React.CSSProperties = {
  margin: '3px 0 0', fontSize: 11, color: 'var(--text-lo)',
};
const badge: React.CSSProperties = {
  marginLeft: 'auto', marginTop: 2,
  background: 'rgba(139,111,212,0.15)',
  border: '1px solid rgba(139,111,212,0.3)',
  borderRadius: 20, padding: '2px 10px',
  fontSize: 12, fontWeight: 700, color: 'var(--violet)',
};
const closeBtn: React.CSSProperties = {
  marginTop: 2, background: 'none',
  border: '1px solid rgba(130,100,220,0.2)',
  borderRadius: 7, padding: '3px 10px',
  color: 'var(--text-lo)', fontSize: 12, cursor: 'pointer',
};
const emptyWrap: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0',
};
const emptyIcon: React.CSSProperties = { fontSize: 36, color: 'var(--violet)', opacity: 0.18 };
const emptyText: React.CSSProperties = {
  margin: '12px 0 4px', fontSize: 14, fontWeight: 600, color: 'var(--text-mid)',
};
const emptyHint: React.CSSProperties = {
  margin: 0, fontSize: 12, color: 'var(--text-lo)', textAlign: 'center', lineHeight: 1.5,
};
const list: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 10 };
const card: React.CSSProperties = {
  background: 'rgba(130,100,220,0.06)',
  border: '1px solid rgba(130,100,220,0.12)',
  borderRadius: 10, padding: '12px 14px',
};
const cardTop: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8,
};
const catChip: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, textTransform: 'capitalize',
  letterSpacing: '0.06em', border: '1px solid',
  borderRadius: 20, padding: '2px 8px',
};
const timeLabel: React.CSSProperties = {
  fontSize: 10, color: 'var(--text-lo)', fontVariantNumeric: 'tabular-nums',
};
const cardContent: React.CSSProperties = {
  margin: 0, fontSize: 13, color: 'var(--text-mid)',
  lineHeight: 1.6, fontStyle: 'italic',
  fontFamily: "'Palatino Linotype','Book Antiqua',Georgia,serif",
};
