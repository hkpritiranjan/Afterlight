'use client';
import { useRef } from 'react';
import { useGame } from '../hooks/useGame';
import MeteorCreateForm from './MeteorCreateForm';
import MeteorReadForm from './MeteorReadForm';
import NotificationToast from './NotificationToast';

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { formState, notification, lightBalance, submitMeteor, acknowledgeMeteor, dismissForm } =
    useGame(canvasRef);

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

      {lightBalance > 0 && (
        <div style={{
          position: 'fixed', bottom: 20, right: 20,
          background: 'rgba(14,18,36,0.85)',
          border: '1px solid rgba(245,197,66,0.3)',
          borderRadius: 20, padding: '6px 14px',
          color: '#f5c542', fontSize: 13, fontWeight: 600,
          zIndex: 5,
        }}>
          ✦ {lightBalance} Light
        </div>
      )}
    </>
  );
}
