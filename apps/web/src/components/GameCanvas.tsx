'use client';
import { useRef, useState } from 'react';
import { useGame } from '../hooks/useGame';
import MeteorCreateForm from './MeteorCreateForm';
import MeteorReadForm from './MeteorReadForm';
import NotificationToast from './NotificationToast';
import ShopOverlay from './ShopOverlay';
import GardenOverlay from './GardenOverlay';

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    formState, notification, lightBalance,
    catalog, ownedItems, gardenObjects,
    submitMeteor, acknowledgeMeteor, dismissForm,
    buyItem, placeGardenObject, removeGardenObject,
  } = useGame(canvasRef);

  const [shopOpen, setShopOpen]     = useState(false);
  const [gardenOpen, setGardenOpen] = useState(false);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', position: 'fixed', inset: 0 }}
        aria-label="Afterlight game world"
      />

      {formState.type === 'create' && (
        <MeteorCreateForm onSubmit={submitMeteor} onDismiss={dismissForm} />
      )}

      {formState.type === 'read' && (
        <MeteorReadForm
          meteor={formState.meteor}
          onAcknowledge={acknowledgeMeteor}
          onDismiss={dismissForm}
        />
      )}

      {notification && <NotificationToast message={notification} />}

      {/* HUD — bottom right */}
      <div style={hudRow}>
        {lightBalance > 0 && (
          <div style={lightPill}>✦ {lightBalance} Light</div>
        )}
        <button style={hudBtn} onClick={() => setShopOpen(true)} title="Garden Shop">
          Shop
        </button>
        <button style={hudBtn} onClick={() => setGardenOpen(true)} title="My Garden">
          Garden
        </button>
      </div>

      {shopOpen && (
        <ShopOverlay
          catalog={catalog}
          ownedItems={ownedItems}
          lightBalance={lightBalance}
          onBuy={(id) => { buyItem(id); }}
          onClose={() => setShopOpen(false)}
        />
      )}

      {gardenOpen && (
        <GardenOverlay
          catalog={catalog}
          ownedItems={ownedItems}
          gardenObjects={gardenObjects}
          lightBalance={lightBalance}
          onPlace={placeGardenObject}
          onRemove={removeGardenObject}
          onOpenShop={() => { setGardenOpen(false); setShopOpen(true); }}
          onClose={() => setGardenOpen(false)}
        />
      )}
    </>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const hudRow: React.CSSProperties = {
  position: 'fixed', bottom: 20, right: 20,
  display: 'flex', alignItems: 'center', gap: 8,
  zIndex: 5,
};
const lightPill: React.CSSProperties = {
  background: 'rgba(14,18,36,0.85)',
  border: '1px solid rgba(245,197,66,0.3)',
  borderRadius: 20, padding: '6px 14px',
  color: '#f5c542', fontSize: 13, fontWeight: 600,
};
const hudBtn: React.CSSProperties = {
  background: 'rgba(14,18,36,0.85)',
  border: '1px solid rgba(91,156,246,0.2)',
  borderRadius: 20, padding: '6px 14px',
  color: 'rgba(200,220,255,0.75)', fontSize: 13, fontWeight: 500,
  cursor: 'pointer',
};
