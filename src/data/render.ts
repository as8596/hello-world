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

/**
 * World tile size in pixels (16 design px x the render scale) = 64.
 *
 * ART EXPORT STANDARD: author every world object at 64 px per tile and place it
 * at scale 1.0 (no runtime scaling), so detail density is uniform and everything
 * sits 1:1. An object that occupies W×H tiles is exported at (W·64)×(H·64) px:
 *   1×1 (rock, bush, item, small shrine) → 64×64
 *   2×2 (pond, large shrine, player frame) → 128×128
 *   4×4 (building) → 256×256
 *   5×5 (large tree) → 320×320
 */
export const TILE_SIZE = 16 * RENDER_SCALE;

/**
 * Main-camera zoom. Kept at an integer so world art renders 1:1 (no fractional
 * scaling = crisp pixels). At 1x the 1280px-wide view shows ~20 tiles.
 */
export const CAMERA_ZOOM = 1;

/**
 * HUD scale (UIScene). 1:1 so the HUD stays crisp; on-screen size is set by the
 * font + element pixels directly rather than a camera zoom.
 */
export const HUD_SCALE = 1;
