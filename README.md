# Brackenvale

A cozy top-down pixel-art action RPG about ringing bells to wake a sleeping
kingdom. Built with TypeScript + Vite + Phaser 4.1.

See [`DESIGN.md`](./DESIGN.md) for the full game design — it's the source of truth.

## Running the game

You run the commands below in a **terminal** (Mac: the **Terminal** app;
Windows: **PowerShell**), not in a browser or text editor.

### 1. Install the tools (one time)

- **[Node.js](https://nodejs.org)** — install the **LTS** version. This provides
  the `node` and `npm` commands.
- **[Git](https://git-scm.com/downloads)** — to download the code.
  *(Optional — you can download a ZIP from GitHub instead, see below.)*

### 2. Get the code and run it

In a terminal, run these one line at a time:

```bash
git clone https://github.com/as8596/hello-world.git
cd hello-world
npm install        # first time only (and after new dependencies are added)
npm run dev
```

`npm run dev` prints a line like `Local: http://localhost:5173/`. Open that
address in your web browser to play. Press **Ctrl+C** in the terminal to stop.

**No Git?** On the GitHub repo page, use the branch dropdown to pick the branch
you want, then **Code → Download ZIP**. Unzip it, `cd` into the folder, and run
`npm install` then `npm run dev`.

### Controls

- **WASD** or **Arrow keys** — move
- **J** / **X** / **click** — swing (cuts vines)
- **E** or **Space** — read sleeping villagers; advance dialogue

## Scripts

| Command           | What it does                                          |
|-------------------|------------------------------------------------------|
| `npm run dev`     | Start the dev server with hot-reload (play the game) |
| `npm run build`   | Type-check and bundle a production build into `dist/`|
| `npm run preview` | Serve the production build locally                   |
| `npm run typecheck` | Type-check only, no build                          |

## Project structure

```
src/
  scenes/      Boot -> Preload -> World scene flow
  entities/    Player and other game objects
  systems/     Engine spine: WorldState, EventBus, TextureFactory
  data/        Typed, data-driven content & config (no content in systems)
public/assets/ sprites / tilesets / maps (placeholder art generated at runtime for now)
```

## Status

Following the MVP build order in `DESIGN.md` §13. **Milestones A & B are done**
(it runs, you move, the overworld is a collidable tilemap, the world reacts).
**Milestone C is underway**: a directional melee swing (wind-up/active/recovery,
input buffering, hit-stop) cuts vines and fights **thorn-sprites** — enemies
with a perception + chase/leash FSM, HP, hit-flash, and a spore-burst death.
You have **hearts**, take contact damage with i-frames + knockback, and on
death the scene restarts. Dodge, the handbell, and the bell-ringing payoff
come next.
