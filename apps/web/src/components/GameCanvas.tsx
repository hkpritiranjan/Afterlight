'use client';

import { useRef } from 'react';
import { useGame } from '@/hooks/useGame';

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useGame(canvasRef);
  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', position: 'fixed', inset: 0 }}
      aria-label="Afterlight game world"
    />
  );
}
