# Thorn-sprite art

```
thorn-sprite/
  rotations/   north.png … south-west.png   (8 static directions, keys thorn-<dir>)
  metadata.json                              (generator export metadata)
  source.zip                                 (original export archive)
```

Eight static 124×124 rotations of the thorn-sprite enemy. Loaded in
PreloadScene as texture keys `thorn-<dir>`; when all eight are present the enemy
uses them in place of the procedural placeholder and faces the way it moves
(`EnemyBase`, driven by `enemies.ts` → `thornSprite.directional`).

Display scale and the collision/hit body are tuned in `src/data/enemies.ts`
under `thornSprite.directional` (`displayScale`, `bodyWidth`, `bodyHeight`).
There are no run/attack animations yet — just rotations; add them later the same
way the player's run cycles work.
