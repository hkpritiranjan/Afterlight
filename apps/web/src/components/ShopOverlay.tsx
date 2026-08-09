'use client';
import type { CatalogItem, OwnedItem } from '../game/types';

const SYMBOL_LABELS: Record<string, string> = {
  stone:   '◉',
  lantern: '◎',
  flower:  '✿',
  fern:    '❧',
  moonbell:'☾',
};

const SYMBOL_COLORS: Record<string, string> = {
  stone:   '#9ca3af',
  lantern: '#fbbf24',
  flower:  '#f472b6',
  fern:    '#4ade80',
  moonbell:'#c4b5fd',
};

interface Props {
  catalog: CatalogItem[];
  ownedItems: OwnedItem[];
  lightBalance: number;
  onBuy: (itemId: string) => void;
  onClose: () => void;
}

export default function ShopOverlay({ catalog, ownedItems, lightBalance, onBuy, onClose }: Props) {
  const ownedSet = new Set(ownedItems.map((o) => o.itemId));

  return (
    <div style={overlay}>
      <div style={modal}>
        <button onClick={onClose} style={closeBtn} aria-label="Close">×</button>
        <div style={header}>
          <h2 style={title}>Garden Shop</h2>
          <div style={balancePill}>✦ {lightBalance} Light</div>
        </div>
        <p style={subtitle}>Spend Light to unlock items for your personal garden.</p>

        <div style={grid}>
          {catalog.map((item) => {
            const owned = ownedSet.has(item.itemId);
            const canAfford = lightBalance >= item.cost;
            const color = SYMBOL_COLORS[item.symbol] ?? '#fff';
            return (
              <div key={item.itemId} style={{ ...card, borderColor: owned ? `${color}55` : 'rgba(255,255,255,0.08)' }}>
                <div style={{ ...symbol, color }}>{SYMBOL_LABELS[item.symbol] ?? '◆'}</div>
                <div style={itemName}>{item.name}</div>
                <div style={costLine}>
                  {owned ? (
                    <span style={{ color: '#4ade80', fontSize: 12, fontWeight: 600 }}>Owned</span>
                  ) : (
                    <button
                      style={{
                        ...buyBtn,
                        opacity: canAfford ? 1 : 0.35,
                        cursor: canAfford ? 'pointer' : 'not-allowed',
                      }}
                      disabled={!canAfford}
                      onClick={() => onBuy(item.itemId)}
                    >
                      {item.cost} Light
                    </button>
                  )}
                </div>
              </div>
            );
          })}
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
  zIndex: 20,
};
const modal: React.CSSProperties = {
  background: 'rgba(12,16,32,0.98)',
  border: '1px solid rgba(91,156,246,0.18)',
  borderRadius: 14,
  padding: '28px 32px 32px',
  width: '100%', maxWidth: 520,
  position: 'relative',
  boxShadow: '0 8px 48px rgba(0,0,0,0.7)',
};
const closeBtn: React.CSSProperties = {
  position: 'absolute', top: 14, right: 18,
  background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
  fontSize: 22, cursor: 'pointer', lineHeight: 1,
};
const header: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4,
};
const title: React.CSSProperties = {
  margin: 0, fontSize: 18, fontWeight: 600, color: '#d0e8ff',
};
const balancePill: React.CSSProperties = {
  background: 'rgba(245,197,66,0.12)',
  border: '1px solid rgba(245,197,66,0.3)',
  borderRadius: 20, padding: '4px 12px',
  color: '#f5c542', fontSize: 13, fontWeight: 600,
};
const subtitle: React.CSSProperties = {
  margin: '0 0 22px', fontSize: 13, color: 'rgba(255,255,255,0.35)',
};
const grid: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12,
};
const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid',
  borderRadius: 10,
  padding: '16px 12px 14px',
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
  textAlign: 'center',
};
const symbol: React.CSSProperties = {
  fontSize: 28, lineHeight: 1, filter: 'drop-shadow(0 0 6px currentColor)',
};
const itemName: React.CSSProperties = {
  fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.8)',
};
const costLine: React.CSSProperties = {
  marginTop: 2,
};
const buyBtn: React.CSSProperties = {
  background: 'rgba(245,197,66,0.15)',
  border: '1px solid rgba(245,197,66,0.4)',
  borderRadius: 14, padding: '4px 12px',
  color: '#f5c542', fontSize: 12, fontWeight: 600,
};
