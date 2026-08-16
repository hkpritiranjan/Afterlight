'use client';
import { useState } from 'react';
import type { CatalogItem, OwnedItem, GardenObject, GardenSymbol } from '../game/types';

const GARDEN_H = 450;

const SYMBOL_CHAR: Record<GardenSymbol, string> = {
  stone:   '◉',
  lantern: '◎',
  flower:  '✿',
  fern:    '❧',
  moonbell:'☾',
};
const SYMBOL_COLOR: Record<GardenSymbol, string> = {
  stone:   '#9ca3af',
  lantern: '#fbbf24',
  flower:  '#f472b6',
  fern:    '#4ade80',
  moonbell:'#c4b5fd',
};

interface Props {
  catalog: CatalogItem[];
  ownedItems: OwnedItem[];
  gardenObjects: GardenObject[];
  lightBalance: number;
  onPlace: (itemId: string, x: number, y: number) => void;
  onRemove: (objectId: string) => void;
  onOpenShop: () => void;
  onClose: () => void;
}

export default function GardenOverlay({
  catalog,
  ownedItems,
  gardenObjects,
  lightBalance,
  onPlace,
  onRemove,
  onOpenShop,
  onClose,
}: Props) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const ownedSet = new Set(ownedItems.map((o) => o.itemId));
  const ownedCatalog = catalog.filter((c) => ownedSet.has(c.itemId));

  function handleGardenClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    if (selectedItemId) {
      onPlace(selectedItemId, x, y);
      setSelectedItemId(null);
    }
  }

  return (
    <div style={overlay}>
      <div style={container}>
        {/* Header */}
        <div style={headerRow}>
          <button onClick={onClose} style={backBtn}>← Back</button>
          <h2 style={titleStyle}>My Garden</h2>
          <div style={rightRow}>
            <span style={balancePill}>✦ {lightBalance} Light</span>
            <button onClick={onOpenShop} style={shopBtn}>Shop</button>
          </div>
        </div>

        {/* Body */}
        <div style={body}>
          {/* Item palette */}
          <div style={palette}>
            <div style={paletteTitle}>Items</div>
            {ownedCatalog.length === 0 ? (
              <p style={emptyPalette}>
                Visit the Shop to<br />unlock items.
              </p>
            ) : (
              ownedCatalog.map((item) => {
                const selected = selectedItemId === item.itemId;
                const color = SYMBOL_COLOR[item.symbol];
                return (
                  <button
                    key={item.itemId}
                    style={{
                      ...paletteItem,
                      borderColor: selected ? color : 'rgba(255,255,255,0.1)',
                      background: selected ? `${color}22` : 'rgba(255,255,255,0.03)',
                    }}
                    onClick={() => setSelectedItemId(selected ? null : item.itemId)}
                    title={item.name}
                  >
                    <span style={{ color, fontSize: 20, filter: 'drop-shadow(0 0 4px currentColor)' }}>
                      {SYMBOL_CHAR[item.symbol]}
                    </span>
                    <span style={paletteLabel}>{item.name}</span>
                  </button>
                );
              })
            )}
            {selectedItemId && (
              <p style={hint}>Click in the garden to place</p>
            )}
          </div>

          {/* Garden area */}
          <div
            style={{
              ...gardenArea,
              cursor: selectedItemId ? 'crosshair' : 'default',
            }}
            onClick={handleGardenClick}
          >
            {gardenObjects.length === 0 && !selectedItemId && (
              <div style={emptyGarden}>
                <span style={{ fontSize: 32, opacity: 0.2 }}>✦</span>
                <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
                  Your garden is empty
                </p>
              </div>
            )}

            {gardenObjects.map((obj) => {
              const color = SYMBOL_COLOR[obj.symbol];
              return (
                <button
                  key={obj.objectId}
                  style={{
                    ...placedItem,
                    left: obj.x - 18,
                    top: obj.y - 18,
                    color,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(obj.objectId);
                  }}
                  title={`Remove ${catalog.find((c) => c.itemId === obj.itemId)?.name ?? 'item'}`}
                >
                  {SYMBOL_CHAR[obj.symbol]}
                </button>
              );
            })}
          </div>
        </div>

        <p style={footer}>Click a placed item to remove it.</p>
      </div>
    </div>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: 'rgba(4,6,14,0.92)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 20,
};
const container: React.CSSProperties = {
  width: '100%', maxWidth: 940,
  background: 'rgba(10,14,28,0.99)',
  border: '1px solid rgba(91,156,246,0.15)',
  borderRadius: 16,
  padding: '24px 28px',
  boxShadow: '0 12px 60px rgba(0,0,0,0.8)',
};
const headerRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20,
};
const backBtn: React.CSSProperties = {
  background: 'none', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8, padding: '6px 14px',
  color: 'rgba(255,255,255,0.6)', fontSize: 13, cursor: 'pointer',
};
const titleStyle: React.CSSProperties = {
  margin: 0, fontSize: 18, fontWeight: 600, color: '#d0e8ff',
};
const rightRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
};
const balancePill: React.CSSProperties = {
  background: 'rgba(245,197,66,0.1)',
  border: '1px solid rgba(245,197,66,0.3)',
  borderRadius: 20, padding: '4px 12px',
  color: '#f5c542', fontSize: 13, fontWeight: 600,
};
const shopBtn: React.CSSProperties = {
  background: 'rgba(91,156,246,0.15)',
  border: '1px solid rgba(91,156,246,0.35)',
  borderRadius: 8, padding: '6px 16px',
  color: '#5b9cf6', fontSize: 13, fontWeight: 600, cursor: 'pointer',
};
const body: React.CSSProperties = {
  display: 'flex', gap: 20,
};
const palette: React.CSSProperties = {
  width: 140, flexShrink: 0,
  display: 'flex', flexDirection: 'column', gap: 6,
};
const paletteTitle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', marginBottom: 4,
};
const paletteItem: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid',
  borderRadius: 8, padding: '8px 10px',
  cursor: 'pointer', width: '100%', textAlign: 'left',
};
const paletteLabel: React.CSSProperties = {
  fontSize: 12, color: 'rgba(255,255,255,0.7)',
};
const emptyPalette: React.CSSProperties = {
  fontSize: 12, color: 'rgba(255,255,255,0.25)',
  margin: '8px 0', lineHeight: 1.5,
};
const hint: React.CSSProperties = {
  fontSize: 11, color: 'rgba(245,197,66,0.6)',
  margin: '4px 0 0', lineHeight: 1.4,
};
const gardenArea: React.CSSProperties = {
  flex: 1,
  height: GARDEN_H,
  background: 'radial-gradient(ellipse at 50% 0%, rgba(20,28,55,1) 0%, rgba(6,8,18,1) 70%)',
  border: '1px solid rgba(91,156,246,0.1)',
  borderRadius: 12,
  position: 'relative',
  overflow: 'hidden',
  boxShadow: 'inset 0 0 60px rgba(0,0,0,0.6)',
};
const emptyGarden: React.CSSProperties = {
  position: 'absolute', inset: 0,
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
};
const placedItem: React.CSSProperties = {
  position: 'absolute',
  width: 36, height: 36,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 22,
  background: 'none', border: 'none',
  cursor: 'pointer',
  filter: 'drop-shadow(0 0 8px currentColor)',
  transition: 'transform .15s',
};
const footer: React.CSSProperties = {
  margin: '14px 0 0',
  fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center',
};
