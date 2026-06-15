/**
 * Global render scale (DESIGN.md §3). The game is authored in "design units"
 * (a 320x180 view, 16px tiles) and rendered at RENDER_SCALE x that, so detailed
 * high-res art (e.g. the 128px player) displays 1:1 without runtime up/down
 * scaling. Spatial values throughout the codebase are written as `N *
 * RENDER_SCALE` so the design intent stays readable and the scale is one knob.
 *
 * Timings (ms), damage, hit-point counts, and similar non-spatial values do NOT
 * scale.
 */
export const RENDER_SCALE = 4;

/** Design view size (the logical resolution before the render scale). */
export const DESIGN_WIDTH = 320;
export const DESIGN_HEIGHT = 180;

/** World tile size in pixels (16 design px x the render scale). */
export const TILE_SIZE = 16 * RENDER_SCALE;

/**
 * Main-camera zoom (cozy, close view). The HUD (UIScene) zooms its own camera by
 * the same factor so it scales with the world instead of looking tiny.
 */
export const CAMERA_ZOOM = 1.3;
