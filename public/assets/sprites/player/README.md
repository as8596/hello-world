# Player sprites

```
player/
  rotations/  north.png … south-west.png   (8 static directions, keys player-<dir>)
  run/        <dir>.png + manifest.json     (run-cycle sheets, keys player-run-<dir>)
  idle/       <dir>.png + manifest.json     (idle "breathing" sheets, keys player-idle-<dir>)
  raw/        run-<dir>.gif, idle-<dir>.gif (source GIFs for each animation set)
```

## Static directional art (`rotations/`)

Eight compass-named PNGs used while idle (and while moving in a direction with no
run cycle yet). Mapped to texture keys `player-<dir>`, picked from the movement
vector (8-way). **Transparent background**, all 128×128; they render 1:1 on the
high-res framebuffer (no scaling), feet anchored via `playerConfig.sprite.originY`
(origin/foot-box knobs in `src/data/playerConfig.ts`). If all eight are present
they're used; otherwise the game falls back to the generated placeholder.

## Running animation (`run/`, from GIFs)

Phaser can't load animated GIFs, so the running GIFs are converted to sprite
sheets:

1. Drop the GIF for each direction in `raw/`, named `run-<dir>.gif`
   (e.g. `raw/run-north.gif`). Same frame size as the static art (128×128),
   transparent background, any frame count.
2. Run `npm run sprites`. For each `raw/run-<dir>.gif` it writes a horizontal
   strip `run/<dir>.png` plus `run/manifest.json` (frame size + count),
   composing GIF frame disposal correctly.
3. Commit the generated `run/*.png` + `run/manifest.json` (the GIFs in `raw/`
   are the source).

The game loads any sheets that exist and plays the matching run cycle while
moving; directions without a sheet use the static frame. Cadence is locked to
distance travelled (`playerConfig.runPixelsPerFrame`) so the feet don't slide.

## Idle animation (`idle/`, from GIFs)

Same pipeline as `run/`, but the GIFs are named `idle-<dir>.gif` and the cycles
play (at `playerConfig.idleFrameRate`) while standing still. Directions without
an idle sheet show the static frame. So far only `idle-south.gif` exists; add
more directions the same way and re-run `npm run sprites`.
