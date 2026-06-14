# Player sprites

## Static directional art (8 rotations)

Eight compass-named PNGs used while idle (and while moving in a direction that
has no run cycle yet):

```
north.png        south.png        east.png        west.png
north-east.png   north-west.png   south-east.png  south-west.png
```

- Mapped to texture keys `player-<dir>`, picked from the movement vector (8-way).
- **Transparent background**, all the same size (128×128). They render 1:1 on
  the high-res framebuffer (no scaling), with the feet anchored via
  `playerConfig.sprite.originY`. Origin/foot-box knobs live in
  `src/data/playerConfig.ts` under `sprite`.

If all eight are present they're used; otherwise the game falls back to the
generated placeholder.

## Running animation (from GIFs)

Phaser can't load animated GIFs, so running GIFs are converted to sprite sheets.

1. Drop the GIF for each direction in `raw/`, named `run-<dir>.gif`
   (e.g. `raw/run-north.gif`, `raw/run-south.gif`). Same frame size as the
   static art (128×128), transparent background, any frame count.
2. Run `npm run sprites`. For each `raw/run-<dir>.gif` it writes a horizontal
   strip `player-run-<dir>.png` plus a shared `player-run.json` manifest
   (frame size + count), composing GIF frame disposal correctly.
3. Commit the generated `player-run-*.png` + `player-run.json` (the raw GIFs in
   `raw/` are the source).

The game loads any sheets that exist (keys `player-run-<dir>`) and plays the
matching run cycle while moving; directions without a sheet use the static
frame. Adding the remaining directions is just: export the GIF → `raw/` →
`npm run sprites`.
