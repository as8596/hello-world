/** Canonical scene keys, so transitions never rely on stringly-typed magic. */
export const SceneKeys = {
  Boot: 'Boot',
  Preload: 'Preload',
  World: 'World',
  UI: 'UI',
  Menu: 'Menu',
  Inventory: 'Inventory',
} as const;

export type SceneKey = (typeof SceneKeys)[keyof typeof SceneKeys];
