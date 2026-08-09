'use client';

import { useEffect, type RefObject } from 'react';
import { GameEngine } from '@/game/engine';

export function useGame(canvasRef: RefObject<HTMLCanvasElement | null>): void {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas);

    const resize = () => {
      engine.resize(window.innerWidth, window.innerHeight);
    };

    resize();
    window.addEventListener('resize', resize);
    engine.start();

    return () => {
      window.removeEventListener('resize', resize);
      engine.stop();
    };
  }, [canvasRef]);
}
