# Player sprite (4 rotations)

Drop four PNGs here to replace the generated placeholder player automatically:

```
public/assets/sprites/player-down.png    # facing the camera (front)
public/assets/sprites/player-up.png      # facing away (back)
public/assets/sprites/player-left.png    # facing left
public/assets/sprites/player-right.png   # facing right
```

Requirements:
- **Transparent background** (PNG alpha) — no white/solid box around the figure.
- All four the **same pixel dimensions** so they scale consistently.
- Any size works; the game scales them to `playerConfig.sprite.targetHeight`
  (default 26px) with the feet near the bottom.

If all four are present they're used automatically; otherwise the game falls
back to the generated placeholder. Tuning knobs (scale, origin, foot collision
box) live in `src/data/playerConfig.ts` under `sprite`.
