'use client';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { GameEngine } from '../game/engine';
import type { FormState, MeteorCategory, ResonanceResponseType } from '../game/types';

export interface GameAPI {
  formState: FormState;
  notification: string | null;
  lightBalance: number;
  submitMeteor: (category: MeteorCategory, content: string) => void;
  acknowledgeMeteor: (meteorId: string, responseType: ResonanceResponseType) => void;
  dismissForm: () => void;
}

export function useGame(canvasRef: RefObject<HTMLCanvasElement | null>): GameAPI {
  const engineRef = useRef<GameEngine | null>(null);
  const [formState, setFormState]     = useState<FormState>({ type: 'none' });
  const [notification, setNotification] = useState<string | null>(null);
  const [lightBalance, setLightBalance] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas, {
      onFormChange: setFormState,
      onNotification: (msg) => {
        setNotification(msg);
        setTimeout(() => setNotification(null), 4000);
      },
      onLightUpdate: (delta) => setLightBalance((prev) => prev + delta),
    });
    engineRef.current = engine;

    const resize = () => engine.resize(window.innerWidth, window.innerHeight);
    resize();
    window.addEventListener('resize', resize);
    engine.start();

    return () => {
      window.removeEventListener('resize', resize);
      engine.stop();
      engineRef.current = null;
    };
  }, [canvasRef]);

  return {
    formState,
    notification,
    lightBalance,
    submitMeteor:      (cat, content) => engineRef.current?.submitMeteor(cat, content),
    acknowledgeMeteor: (id, type)     => engineRef.current?.acknowledgeMeteor(id, type),
    dismissForm:       ()             => engineRef.current?.dismissForm(),
  };
}
