# Player sprite (8 rotations)

The player uses eight directional PNGs (compass-named) in this folder:

```
north.png        south.png        east.png        west.png
north-east.png   north-west.png   south-east.png  south-west.png
```

- Mapped to texture keys `player-<dir>` and selected from the movement vector
  (8-way), so the character faces the exact direction it walks.
- **Transparent background** (PNG alpha); all the same pixel size (currently
  128x128). The game scales them to `playerConfig.sprite.targetHeight` with the
  feet anchored via `originY`.

If all eight are present they're used automatically; otherwise the game falls
back to the generated placeholder. Scale/origin/foot-collision-box knobs live in
`src/data/playerConfig.ts` under `sprite`.
