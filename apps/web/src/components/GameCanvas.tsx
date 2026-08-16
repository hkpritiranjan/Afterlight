'use client';
import { useRef, useState } from 'react';
import { useGame } from '../hooks/useGame';

import MeteorCreateForm   from './MeteorCreateForm';
import MeteorReadForm     from './MeteorReadForm';
import NotificationToast  from './NotificationToast';
import ShopOverlay        from './ShopOverlay';
import GardenOverlay      from './GardenOverlay';
import PlayerProfileCard  from './PlayerProfileCard';
import Compass            from './Compass';
import NavIconBar         from './NavIconBar';
import FeatureSidebar     from './FeatureSidebar';
import ActionBar          from './ActionBar';
import DailyLightCard     from './DailyLightCard';
import ActiveMeteorsPanel from './ActiveMeteorsPanel';
import MapOverlay         from './MapOverlay';
import StarsPanel         from './StarsPanel';
import JournalPanel, { saveJournalEntry } from './JournalPanel';
import EditProfileModal, { loadPlayerName } from './EditProfileModal';

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    formState, notification, lightBalance,
    catalog, ownedItems, gardenObjects,
    onlineCount, meteors, stars, getMapSnapshot,
    openCreateForm, submitMeteor, acknowledgeMeteor, dismissForm,
    buyItem, placeGardenObject, removeGardenObject,
  } = useGame(canvasRef);

  const [shopOpen,     setShopOpen]     = useState(false);
  const [gardenOpen,   setGardenOpen]   = useState(false);
  const [mapOpen,      setMapOpen]      = useState(false);
  const [starsOpen,    setStarsOpen]    = useState(false);
  const [journalOpen,  setJournalOpen]  = useState(false);
  const [profileOpen,  setProfileOpen]  = useState(false);
  const [mapSnapshot, setMapSnapshot]   = useState(() => getMapSnapshot());
  const [playerName,  setPlayerName]    = useState(() => loadPlayerName() || 'Wanderer');

  const isFormOpen = formState.type !== 'none';
  const anyModalOpen = isFormOpen || shopOpen || gardenOpen || mapOpen || starsOpen || journalOpen || profileOpen;

  function openMap() {
    setMapSnapshot(getMapSnapshot());
    setMapOpen(true);
  }

  function handleSubmitMeteor(category: Parameters<typeof submitMeteor>[0], content: string) {
    saveJournalEntry(category, content);
    submitMeteor(category, content);
  }

  return (
    <>
      {/* ── Layer 2: Transparent game canvas ─────────────────────────────── */}
      <canvas ref={canvasRef} aria-label="Afterlight game world" />

      {/* ── Layer 3: Glass HUD (hidden when any modal is open) ───────────── */}
      {!anyModalOpen && (
        <>
          <PlayerProfileCard
            playerName={playerName}
            lightBalance={lightBalance}
            onClick={() => setProfileOpen(true)}
          />
          <Compass />
          <NavIconBar
            onJournal={() => setJournalOpen(true)}
            onWrite={openCreateForm}
          />
          <FeatureSidebar
            onRelease={openCreateForm}
            onMap={openMap}
            onStars={() => setStarsOpen(true)}
            onGarden={() => setGardenOpen(true)}
          />
          <ActiveMeteorsPanel meteors={meteors} />
          <ActionBar
            onMap={openMap}
            onRelease={openCreateForm}
            onGarden={() => setGardenOpen(true)}
          />
          <DailyLightCard />
          <OnlineIndicator count={onlineCount} />
        </>
      )}

      {/* ── Meteor create / read forms ────────────────────────────────────── */}
      {formState.type === 'create' && (
        <MeteorCreateForm onSubmit={handleSubmitMeteor} onDismiss={dismissForm} />
      )}
      {formState.type === 'read' && (
        <MeteorReadForm
          meteor={formState.meteor}
          onAcknowledge={acknowledgeMeteor}
          onDismiss={dismissForm}
        />
      )}

      {/* ── Notification toast ────────────────────────────────────────────── */}
      {notification && <NotificationToast message={notification} />}

      {/* ── Map overlay ───────────────────────────────────────────────────── */}
      {mapOpen && (
        <MapOverlay
          snapshot={mapSnapshot}
          meteors={meteors}
          stars={stars}
          onClose={() => setMapOpen(false)}
        />
      )}

      {/* ── Stars panel ───────────────────────────────────────────────────── */}
      {starsOpen && (
        <StarsPanel stars={stars} onClose={() => setStarsOpen(false)} />
      )}

      {/* ── Journal panel ─────────────────────────────────────────────────── */}
      {journalOpen && (
        <JournalPanel onClose={() => setJournalOpen(false)} />
      )}

      {/* ── Edit profile modal ────────────────────────────────────────────── */}
      {profileOpen && (
        <EditProfileModal
          currentName={playerName}
          onSave={setPlayerName}
          onClose={() => setProfileOpen(false)}
        />
      )}

      {/* ── Shop overlay ─────────────────────────────────────────────────── */}
      {shopOpen && (
        <ShopOverlay
          catalog={catalog}
          ownedItems={ownedItems}
          lightBalance={lightBalance}
          onBuy={(id) => { buyItem(id); }}
          onClose={() => setShopOpen(false)}
        />
      )}

      {/* ── Garden overlay ───────────────────────────────────────────────── */}
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

// ── Online indicator ──────────────────────────────────────────────────────────

function OnlineIndicator({ count }: { count: number }) {
  return (
    <div style={onlinePill}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--sage)' }}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
      <span style={onlineText}>{count} · Online</span>
    </div>
  );
}

const onlinePill: React.CSSProperties = {
  position: 'fixed', bottom: 104, right: 20,
  display: 'flex', alignItems: 'center', gap: 5,
  padding: '5px 11px',
  background: 'var(--glass-bg)',
  border: '1px solid var(--glass-border)',
  borderRadius: 'var(--r-pill)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  zIndex: 10,
};
const onlineText: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: 'var(--text-lo)',
  fontVariantNumeric: 'tabular-nums',
};
