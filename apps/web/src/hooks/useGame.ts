'use client';
import { useEffect, useRef, useState, useCallback, type RefObject } from 'react';
import { GameEngine } from '../game/engine';
import type { FormState, MeteorCategory, ResonanceResponseType, CatalogItem, OwnedItem, GardenObject } from '../game/types';

export interface GameAPI {
  formState: FormState;
  notification: string | null;
  lightBalance: number;
  catalog: CatalogItem[];
  ownedItems: OwnedItem[];
  gardenObjects: GardenObject[];
  submitMeteor: (category: MeteorCategory, content: string) => void;
  acknowledgeMeteor: (meteorId: string, responseType: ResonanceResponseType) => void;
  dismissForm: () => void;
  buyItem: (itemId: string) => void;
  placeGardenObject: (itemId: string, x: number, y: number) => void;
  removeGardenObject: (objectId: string) => void;
}

export function useGame(canvasRef: RefObject<HTMLCanvasElement | null>): GameAPI {
  const engineRef = useRef<GameEngine | null>(null);
  const [formState, setFormState]         = useState<FormState>({ type: 'none' });
  const [notification, setNotification]   = useState<string | null>(null);
  const [lightBalance, setLightBalance]   = useState(0);
  const [catalog, setCatalog]             = useState<CatalogItem[]>([]);
  const [ownedItems, setOwnedItems]       = useState<OwnedItem[]>([]);
  const [gardenObjects, setGardenObjects] = useState<GardenObject[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas, {
      onFormChange: setFormState,
      onNotification: (msg) => {
        setNotification(msg);
        setTimeout(() => setNotification(null), 4000);
      },
      onLightUpdate: setLightBalance,
      onCatalogReady: setCatalog,
      onShopBought: (_item, balance, owned) => {
        setLightBalance(balance);
        setOwnedItems(owned);
      },
      onGardenChanged: setGardenObjects,
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

  const buyItem = useCallback((itemId: string) => engineRef.current?.buyItem(itemId), []);
  const placeGardenObject = useCallback(
    (itemId: string, x: number, y: number) => engineRef.current?.placeGardenObject(itemId, x, y),
    [],
  );
  const removeGardenObject = useCallback(
    (objectId: string) => engineRef.current?.removeGardenObject(objectId),
    [],
  );

  return {
    formState,
    notification,
    lightBalance,
    catalog,
    ownedItems,
    gardenObjects,
    submitMeteor:      (cat, content) => engineRef.current?.submitMeteor(cat, content),
    acknowledgeMeteor: (id, type)     => engineRef.current?.acknowledgeMeteor(id, type),
    dismissForm:       ()             => engineRef.current?.dismissForm(),
    buyItem,
    placeGardenObject,
    removeGardenObject,
  };
}
