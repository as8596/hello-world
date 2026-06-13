# Brackenvale — Game Design Document

> A cozy top-down action RPG about ringing bells to wake a sleeping kingdom.
> **Status:** living draft · **Build target:** vertical slice (Region 1, “Thistledown”)

-----

## 1. High concept

Brackenvale is a top-down, real-time action RPG in the Zelda-like tradition, wrapped in a warm, hopeful tone with a thread of gentle melancholy. A generation ago a soft enchantment called the **Hush** drifted across the kingdom like silver fog; everyone it touched lay down and slept where they stood, and the wild grew over the towns they left behind. You play a young apprentice who woke immune. Travelling region by region, you fight your way to each slumbering shrine and **ring its great bell** — pushing back the Hush, waking the people, and turning each overgrown ruin back into a living town.

The fantasy the game sells: *bringing a dead place back to life.*

## 2. Pillars

- **Cozy, not grim.** Enemies are territorial creatures that moved in while everyone slept, not evil. Even bosses are calmed, not slaughtered.
- **Discovery over grind.** Power comes from going places, not farming.
- **Earned payoffs.** Every region ends with a town visibly blooming back to life.
- **Build identity.** A meaty RPG layer (classes + skill trees) sits under the action.

## 3. Technical foundation

|           |                                                                      |
|-----------|----------------------------------------------------------------------|
|Language   |TypeScript                                                            |
|Build tool |Vite (fast HMR)                                                       |
|Engine     |Phaser 4.1 (“Salusa”) — arcade physics, tilemaps, `pixelArt: true`    |
|Perspective|Top-down, 2D tiles                                                    |
|Combat     |Real-time action                                                      |
|Art        |Pixel art; placeholder assets first (Kenney.nl, LPC), custom art later|

Phaser 4 keeps the Phaser 3 API mostly intact (it’s primarily a renderer rewrite), so existing Phaser 3 tutorials still apply. Use the standard `import Phaser from 'phaser'` (fixed in 4.1).

## 4. Core loop

Explore a hand-built overworld → fight in real-time → grow stronger (tools **and** stats/levels) → that new power unlocks shrines and regions → clear a shrine capped by a boss → **ring the bell** → the town wakes and becomes a safe hub → repeat. Towns are hubs for talking, healing, and gearing up.

## 5. World & story

- **The Hush** — a gentle sleep-enchantment that ended the kingdom without violence. Its cause is the game’s central mystery, revealed toward the endgame.
- **The Wardens** — the lost order who kept the great shrine bells that held the Hush at bay. When the last Warden fell asleep, the bells fell silent and the Hush won.
- **The bells** — ringing a region’s great bell pushes the Hush back from that region, waking its people.
- **The protagonist** — a young apprentice who woke immune, likely because they fell asleep clutching a **Warden’s Handbell** that kept faintly ringing. That handbell is your starting tool.
- **The Oaths** — the Warden order was three lost traditions. As you wake the kingdom you revive one in yourself (your class — see §8).

## 6. Progression: two parallel tracks

Keeping these separate is what makes the system sing.

- **Tools — horizontal.** New verbs that gate the world Metroidvania-style (handbell, grapple-vine, dash-boots…). No numbers; they unlock places and tricks.
- **Stats, XP & levels — vertical.** The numbers that climb and let you build a character.

**Anti-grind design (keeps it cozy even with XP):** the XP curve is front-loaded so you level fast early; regional creatures don’t respawn infinitely (no farming); the world is hand-tuned to your expected level per region. Bell-ringing drops a big milestone XP payout, so the narrative spine and the power spine reinforce each other.

## 7. Stats & resources

The five stats live **inside** the skill trees as nodes — there is no separate stat-point screen. One currency (skill points from leveling) flows into your Oath’s tree.

|Stat       |Governs                                          |
|-----------|-------------------------------------------------|
|**Vigor**  |Max health (hearts)                              |
|**Might**  |Melee damage                                     |
|**Warding**|Incoming damage reduction                        |
|**Grace**  |Stamina pool + regen, dodge i-frames, crit chance|
|**Focus**  |Echo pool size + ability potency                 |

Three live combat resources:

- **Health** (hearts) — driven by Vigor.
- **Stamina** — driven by Grace; spent on dodges and heavy swings.
- **Echoes** — a shared resource every class spends on its active abilities. Focus just enlarges the pool; a Bellsinger stacks Focus to spam spells, an Oathblade dips in occasionally for a big finisher.

## 8. Classes (Oaths) & skill trees

Three Oaths, sworn early (right after the Thistledown tutorial). Classic tank / skirmisher / caster triangle, themed to the bell-and-bramble world.

- **⚔️ Oathblade** — sword-and-shield martial Warden. Branches: Guardian (defense) / Vanguard (offense).
- **🏹 Wildstrider** — nimble Grace-based skirmisher who fights *with* the wild. Branches: Hunter (ranged/traps) / Beastfriend (summoned allies).
- **🔔 Bellsinger** — Focus-based caster who fights with sound. Branches: Resonance (offensive sound) / Chime (heal/support — can literally lull foes to sleep, a controlled sliver of the Hush itself).

### 8.1 Skill-tree mechanics

- **Single currency** — skill points from leveling; spent in your Oath’s tree.
- **Node types** — passive (often ranked), active (new combat move), choice (mutually exclusive), ultimate (capstone), bridge (hybrid).
- **Ranked nodes** — sink multiple points for a scaling effect (e.g. +5% damage per rank).
- **Tier gates** — deeper nodes unlock only after enough points are spent *in that branch*; ultimates gate at **5 in-branch**.
- **Choice nodes** — pick one of two; can’t have both. Real build decisions.
- **Bridge node** — rewards splitting points across both branches (gate: 3+ in **each**), so pure isn’t always optimal.
- **Respec** — cheap at any woken town’s shrine. No build anxiety.
- **Data-driven** — a node is just `{ id, name, type, max, prereq, gate, effect }`. The engine renders whatever’s in the data, so all three trees share one system and new nodes are pure data.

### 8.2 Oathblade tree (reference — fully specced)

12 skill points ≈ level 12; maxing everything costs 14, so you can’t have it all.

|Node            |Branch  |Type    |Pts|Unlocks at      |Effect                                                                         |
|----------------|--------|--------|---|----------------|-------------------------------------------------------------------------------|
|Warden’s Resolve|Trunk   |Passive |1  |start           |+10 max stamina · foundation                                                   |
|Bulwark         |Guardian|Passive |1–3|Warden’s Resolve|+4% damage reduction / rank                                                    |
|Shield Bash     |Guardian|Active  |1  |Bulwark         |Stunning bash · costs Echoes                                                   |
|Aegis Oath      |Guardian|Choice  |1  |3 in Guardian   |*Stalwart* (guarding regens stamina) **or** *Thornmail* (guarding reflects 20%)|
|Unbroken Oath   |Guardian|Ultimate|1  |5 in Guardian   |Below 30% HP: take 40% less, next Bash free                                    |
|Honed Edge      |Vanguard|Passive |1–3|Warden’s Resolve|+5% melee damage / rank                                                        |
|Resonant Strike |Vanguard|Active  |1  |Honed Edge      |Heavy swing + sonic shockwave · Echoes                                         |
|Vanguard Oath   |Vanguard|Choice  |1  |3 in Vanguard   |*Bloodsong* (hits restore Echoes) **or** *Overwhelm* (chained hits ramp damage)|
|Ringing Charge  |Vanguard|Ultimate|1  |5 in Vanguard   |Line dash-strike; max combo = guaranteed crits                                 |
|Bellforged Body |Bridge  |Passive |1  |3+ in **both**  |+1 heart and +5% damage                                                        |

The Wildstrider and Bellsinger trees follow the identical shape (ranked-passive → active → choice → ultimate per branch, plus a bridge) and are TODO to spec node-by-node.

## 9. Combat feel

Real-time, top-down. The player’s verbs: move, melee strike (directional hitbox), dodge (stamina-gated dash with i-frames), ring the handbell (AoE stun + fog dispel), and Echo-spending class actives. Enemies telegraph wind-ups so dodge timing matters. Armored foes can’t be traded with — you ring to stun, then strike, the game’s signature combo.

## 10. Bestiary (starter set)

Territorial, cozy-menacing creatures that moved in while everyone slept:

- **Thorn-sprites** — weak, slow; the teaching enemy.
- **Mushroom-folk** — telegraph a wind-up; teach dodge timing.
- **Bramblebacks** — armored; require the ring-to-stun combo.
- **Feral boars** — chargers.
- **Will-o’-wisps** — drifting ranged nuisances.
- **Region guardians** — large overgrown bosses nesting in each shrine.

## 11. Tools

- **Warden’s Handbell** (start) — ring for an AoE stun pulse on enemies and to dispel Hush-fog. Double duty all game.
- *Future (TODO):* grapple-vine (cross gaps), dash-boots (traverse + combat dash), and others that gate later regions.

## 12. Region 1 — Thistledown (the vertical slice)

Tutorial design principle: **teach every core verb in a safe moment, then test it under pressure at the boss.** South (you wake) to north (the bell):

```
                 ┌───────────────────────────┐
                 │      THE BELLTOWER         │   shrine + boss
                 │   the great bell (silent)  │   ring it -> wake the valley
                 └─────────────┬──────────────┘
                       three resonance chimes
                        (combat arenas + light puzzle)
                               │
                    ~ ~ Thornwood Trail ~ ~        dodge timing,
                       /                \           ring-to-stun combo
                 [Sproutling Charm]   brambleback
                               │
                 ┌─────────────┴──────────────┐
                 │    SLEEPING THISTLEDOWN     │   cut vines, thorn-sprites,
                 │  barn (heart frag)  fog wall│   handbell dispels the fog
                 └─────────────┬──────────────┘
                               │
                       The Waking Hollow            you wake here
                    (starting blade + handbell)
                            ^ START
```

**Beats & teaching:**

1. **The Waking Hollow** — wake among sleeping bodies (the emotional hook); find the blade and the Warden’s Handbell. Teaches: movement only.
1. **Sleeping Thistledown** — cut vines (risk-free striking), then thorn-sprites (attack + dodge vs a live enemy), then a Hush-fog wall (ring bell to dispel). Optional barn hides a **heart fragment**.
1. **Thornwood Trail** — mushroom-folk teach dodge *timing*; a brambleback teaches the **ring-to-stun → strike** combo. Side pocket: **Sproutling Charm** (+Echo regen).
1. **The Belltower** — mini-dungeon: ring **three resonance chimes** (each a small combat arena) to “tune” the bell and open the boss door.

**Boss — Bramblewerth, the Thornwarden:**

- *Phase 1* — telegraphed sweeping vine-swipe (dodge); spawns thorn-sprite adds. Core is armored; it periodically rears and vents Hush-fog — the cue to **ring → stun → strike the core**. The whole region was teaching this.
- *Phase 2* (below half HP) — faster; adds a ground-slam shockwave to dodge on timing.
- *Resolution* — you sever the Hush-corruption rather than kill it; it shrinks into a harmless dormant bramble. Tone stays gentle.

**Payoff:**

- Ring the great bell → a wave of clear air rolls across the valley → **the village wakes** (fog gone, villagers upright).
- Granted your **first full heart** (fragment + bell reward).
- **Choose your Oath** — an old Warden’s resonance offers the three traditions; pick one.
- Thistledown becomes your **hub**: a shopkeeper (Maple’s general store), a hearth to save/heal, and the **first quest** (a child still asleep beyond the eastern fog, too thick for the handbell — points to Region 2). The east path is gated until you find the next tool.

## 13. MVP build order

Every step ends in something playable. Uses placeholder art throughout.

**Milestone A — it runs and you can move**

1. Scaffold: Vite + Phaser 4.1 + TS, `pixelArt: true`, arcade physics, Boot → Preload → World. *Done:* `npm run dev` shows a crisp blank canvas.
1. Player movement: `Player` entity, 8-dir movement, walk anim, camera follow. *Done:* you walk around an empty map.

**Milestone B — a world with walls**
3. Tilemap + collision layer (walls/water/vines block). *Done:* you follow the path and can’t clip walls.
4. Interactables + destructibles: cut vines, read sleeping villagers. *Done:* clearing vines opens a lane.

**Milestone C — combat**
5. Attack + directional hitbox, swing anim, cooldown. *Done:* swinging destroys vines / hits a target.
6. Enemy + health/damage: thorn-sprite chase AI + HP; player hearts, contact damage, i-frames, knockback, death→restart. *Done:* you can fight and be hurt.
7. Dodge: stamina-gated dash with i-frames. *Done:* you can roll through an attack.

**Milestone D — signature systems**
8. The Handbell: ring → AoE stun + dispel a fog region. *Done:* ringing stuns sprites and clears the fog wall.
9. Hearts + pickups: heart UI (`UIScene`), heart-fragment pickup raises max HP, hearth to save/heal. *Done:* fragment adds a heart, UI updates.

**Milestone E — dungeon & boss**
10. Belltower + three chimes gate the boss door. *Done:* all three chimes open the door.
11. Bramblewerth: swipe, adds, rear-up → ring → stun → strike loop, phase-2 shockwave, defeat. *Done:* beatable via the bell-stun combo.

**Milestone F — payoff & loop closure**
12. Ring the great bell → village-wake state flip with a clear-air transition. *Done:* the hub visibly transforms.
13. The hub: shopkeeper dialogue/shop stub, Oath-choice moment (applies a small starting bonus for now), first-quest text pointing east. *Done:* you can talk to Maple and pick an Oath.

**Milestone G — post-slice depth (only after 1–12 play start to finish)**
14. Wire in the data-driven skill trees (Oathblade node data + unlock/gate/refund logic already prototyped), XP/leveling, and the Echo resource.

**Discipline:** don’t build the skill tree first just because we designed it most. Steps 1–12 prove the core loop is fun before the RPG depth gets layered on.

## 14. Game feel & polish (the MVP feel layer)

A functional combat loop and a *good-feeling* one are different games. These are the items that make the slice fun to touch. Priorities: **P0** = the slice feels bad without it, **P1** = strong polish, **P2** = later.

**Movement**

- Delta-time movement + diagonal normalization so diagonals aren’t faster. *(P0)*
- A touch of acceleration/friction so movement has weight without feeling floaty. *(P1)*
- Footstep dust puffs + soft step SFX; a 1–2px walk bob. *(P2)*

**Combat — the big juice multipliers**

- **Hit-stop:** freeze a few frames on a connecting hit. Single highest-impact feel item. *(P0)*
- Knockback on both player and enemies. *(P0)*
- Enemy **hit-flash** (flash white) plus a spore/leaf burst and fade on death — no instant pop. *(P0 flash / P1 death VFX)*
- **Input buffering:** queue an attack or dodge pressed slightly early so it fires on the next valid frame. Makes controls feel tight. *(P0)*
- Attack rhythm: distinct wind-up → active → recovery frames so swings have timing. *(P0)*
- Screenshake on heavy hits and on taking damage, with a “reduce shake” toggle. *(P1)*
- Dodge: i-frame flash + dust poof + brief afterimage. *(P1)*

**The Handbell — the signature move must feel powerful**

- A visible expanding shockwave ring synced to a resonant bell SFX. *(P0)*
- Stunned enemies get an unmistakable state (wobble/stars, frozen anim, visible timer). *(P0)*
- Fog dispels by receding/animating, not popping. *(P0)*
- A gentle screen pulse on ring — cozy, not jarring. *(P1)*

**Enemy readability (fair fights)**

- Clear wind-up telegraph (color shift / scale-up / indicator) so dodge timing is learnable. *(P0)*
- A notice cue (”!” + sound) when an enemy spots you. *(P1)*
- Cozy default: no floating damage numbers; rely on flash + knockback.

**Camera**

- Follow with a small dead-zone + slight lerp, not a rigid lock. *(P1)*
- Brief pan to Bramblewerth on boss entry; lookahead in the move direction. *(P1–P2)*

**The “wake the valley” payoff — over-invest here**

- This is the emotional climax of the slice. The clear-air wave should be a real VFX sweeping the screen, music swelling, fog receding in sequence, villagers rising. *(P0)*
- A slow-mo beat + big resonant toll when you ring the great bell. *(P0)*

**Quality floor**

- Fixed/delta timestep so feel is framerate-independent. *(P0)*
- Pause menu; master-volume + reduce-shake settings; gamepad support (Phaser has it). *(P1)*
- Soft, fading control hints instead of a wall of tutorial text. *(P1)*

**Rule of thumb:** build each P0 feel item *alongside* its spine step — hit-stop with step 5’s attack, the shockwave with step 8’s handbell — not as a separate pass at the end. Feel is cheapest to get right while the system is fresh.

## 15. Art & audio direction

- **Visuals:** pixel art; cozy palette — sunlit greens and overgrown ruins, brass bells, mossy dusk for shrines. Start with free, openly-licensed placeholder assets (Kenney, LPC), swap to custom later.
- **Audio (TODO):** the bell motif as a recurring leitmotif; the moment a region wakes should have a signature “clear-air” sting.

## 16. Dialogue & quest system

Both systems share one backbone: a **flag store + event bus**. This is what makes a town feel alive (Maple asleep → awake → remembers your quest) without special-case code.

**Core services**

- `WorldState` — a flat store of flags/counters; the single source of truth for player progress (`bell_thistledown_rung: true`, `quest_sleeping_child: 'active'`, `sprites_killed: 3`). Also exactly what the save system serializes.
- `EventBus` — emits game events (`enemyKilled`, `itemPickedUp`, `areaEntered`, `bellRung`, `npcTalked`, `dialogueChoice`). Quests listen, effects write flags, the world reacts to flags.

**Dialogue (data-driven).** Each NPC has a list of entries; the engine plays the *first whose conditions pass*, so one NPC says different things over time.

```ts
interface DialogueNode {
  id: string; speaker: string; portrait?: string; text: string;
  next?: string;          // linear
  choices?: Choice[];     // player picks a response
  effects?: Effect[];     // side-effects, then continue
  end?: boolean;
}
interface Choice { text: string; when?: Condition[]; next?: string; effects?: Effect[]; }
```

Small composable vocabulary:

```
Conditions:  { flag:'bell_thistledown_rung', is:true }
             { quest:'sleeping_child', state:'active' }
             { counter:'sprites_killed', atLeast:3 }
Effects:     { setFlag:'met_maple', to:true }   { startQuest:'sleeping_child' }
             { giveItem:'coin', amount:10 }      { openShop:'maple_store' }
             { giveXp:25 }                        { advanceQuest:'sleeping_child' }
```

**Quests** are ordered objectives that listen to events:

```ts
interface Quest {
  id: string; title: string; summary: string;
  prereq?: Condition[];
  steps: QuestStep[];     // each completes on a matching event
  rewards?: Effect[];     // fire when the last step completes
}
interface QuestStep { id: string; text: string; on: EventMatch; }
// on: { event:'bellRung', region:'thistledown' } | { event:'enemyKilled', type:'thorn_sprite', count:3 }
```

**Worked example — Maple.** One NPC definition, four entries matched top-down by state: (1) before the bell, asleep — no real talk; (2) after the bell, first chat — thanks, `openShop`, `startQuest: sleeping_child`; (3) quest active — nudges you east; (4) quest done — gratitude + reward + new stock. No engine changes between states; it’s all entry conditions reading flags the bell and quest set.

**UI:** bottom dialogue box (speaker, portrait, typewriter reveal, advance/skip); choices as a selectable list; a quest journal (toggle key); the current objective pinned as a one-liner on the HUD.

**MVP scope (build steps 4 & 13):** flag store + event bus, linear typewriter dialogue, the conditional-entry mechanism (Maple differs before/after the bell), one quest with talk → go-east → stub steps and the pinned HUD objective. Branching choices, portraits, and the full journal are P1.

## 17. Enemy AI & encounter design

Guiding idea: keep each enemy simple, make each pressure a *different verb*, then combine them. Difficulty comes from composition, not smarter individuals.

**AI = shared FSM + perception.** Every enemy runs the same state machine with per-type tuning:

`idle/patrol → notice → chase → windup → attack → recover → (stunned) → flee → dead`

Perception is a vision radius + line-of-sight check vs walls, an aggro range, and a **leash range** so enemies return home if you leave (anti-grind in action). First sighting plays a notice cue (`!` + sound); `windup` is always a visible telegraph so dodging is fair. Light separation steering stops groups stacking into a blob.

```ts
interface EnemyDef {
  id; name; hp; speed; contactDamage;
  vision; aggroRange; leashRange;
  armored?: boolean;        // immune unless bell-stunned
  stunnable?: boolean;      // handbell interaction (default true)
  attack: { type:'lunge'|'overhead'|'charge'|'projectile';
            windupMs; activeMs; recoverMs; damage; range; };
  onDeath?: Effect[];       // spore puff, drop, xp; emits enemyKilled
}
```

**The five starters, each a distinct role:**

|Enemy        |Behavior                                  |Verb it pressures          |
|-------------|------------------------------------------|---------------------------|
|Thorn-sprite |rushes, contact lunge                     |crowd control              |
|Mushroom-folk|telegraphed overhead; spore puff on death |dodge timing               |
|Brambleback  |armored — only hittable while bell-stunned|the ring-to-stun combo     |
|Feral boar   |telegraphed charge, self-stuns on walls   |baiting & spacing          |
|Will-o’-wisp |floats, keeps distance, lobs projectiles  |positioning / line-of-sight|

**Encounters are recipes.** A brambleback alone is a puzzle; a brambleback + two sprites is a fight, because the sprites punish you during the moment you’re committed to the bell-stun — emergent friction, no new AI. Principles: introduce each role solo, then combine; vary arena shape (open / choke / pillars that break wisp line-of-sight / thorn-hazard floors); vary structure (clear-all, waves, defend-while-you-ring); keep telegraph density readable (one anchor + cheap rushers, never eight wind-ups at once); leash + limited respawn so the overworld isn’t a gauntlet.

**Thistledown encounter ladder** (= the difficulty curve):

- *Village:* lone sprite → yard cluster of three.
- *Trail:* mushroom-folk solo → mushroom-folk + sprite → brambleback solo → optional boar guarding the charm.
- *Belltower chimes:* room 1 sprite wave; room 2 brambleback + sprites; room 3 wisp + mushroom-folk on a pillared floor.
- *Boss:* Bramblewerth spawns sprite adds — boss and encounter design converge on the same skills.

**Implementation note:** a shared `EnemyBase` class running the FSM in `update()`, arcade physics for movement/overlap, timers for windup/active/recover, hand-placed via Tiled object layers. Death emits `enemyKilled` on the event bus (feeds quests).

## 18. Lore (MVP scope)

Canon scoped to the Thistledown slice. Keeps the big mysteries (the Hush’s cause; Warden Sorrel’s fate) unanswered.

- **The Hush** — arrived one ordinary autumn evening as a silver quiet rolling down from the high country. Whoever it touches lies down “just for a moment” and doesn’t wake: they don’t age, hunger, or dream. It isn’t death; the land just went quiet and the green grew in. No one awake knows its cause. *(Central mystery — not answered in the slice.)*
- **The Wardens & bells** — kept the kingdom’s bells on the belief that the world stays awake by being *attended to* (sound, name, ritual). The great shrine bells said *we are still here*. They rang against the Hush for years, then nodded off one by one until the last bell fell silent.
- **The handbell** — a Warden’s personal night-watch bell. Yours kept faintly ringing as you slept, which is why you alone woke. *Flavor: “small enough for a pocket, loud enough to keep one soul awake.”*
- **You** — youngest apprentice of the Thistledown Warden, **Warden Sorrel** (now missing — a thread). Borrowed your master’s handbell the night the Hush fell. Default name **Wren**; player-renamable.
- **Thistledown** — a farming valley of orchards, thistle-honey, bell-pears. People sleep where the Hush found them.
  - **Maple** — ran the general store; first to wake at the peal. Shopkeeper + village voice + quest-giver.
  - **Bram** — a boy who wandered toward the eastern fog the night of the Hush; asleep just beyond it where the fog is too thick for a handbell. Subject of the first quest. (Bram → brambles; he wandered toward the shrine.)
- **Bramblewerth, the Thornwarden** (boss) — not a monster. Every shrine had a Thornwarden: a gentle bramble-beast grown from a seed at the bell’s roots to *tend* the shrine. Thistledown’s never got the waking peal, slept too long, and the Hush-fog tangled its dreams into thorns. You don’t slay it — ringing the bell reaches it, the thorns fall, and it shrinks back into a dozing seedling-beast.
- **The waking peal** — the bell’s ring means *it’s morning, come back*. The Hush lifts like burning fog; sleepers wake gently, not knowing a generation passed. The melancholy: they wake to wild crops, rusted tools, lost years — but together and alive. The game’s core hope.
- **The three Oaths** (offered at the choosing): Oathblade — “a bell is only as safe as the arm that guards it”; Wildstrider — “the green was never the enemy; it only forgot it was a garden”; Bellsinger — “every bell is a question, and the right voice is the answer.”
- **Environmental storytelling** in the sleeping village: a kettle still warm after a generation; a chalk hopscotch grid with children asleep on its squares; vines grown politely *around* sleepers without touching them.

## 19. Economy & shops

The economy’s real job is to power the **restoration fantasy** — money is how a woken town comes back to life — not to sell bigger numbers.

**Philosophy:** anti-grind. The coin faucet is bounded (enemies don’t respawn infinitely), so coin is earned by exploring and progressing, never farmed. Prices are tuned to what a thorough explorer naturally accumulates — no grind walls.

**Currencies:**

- **Coin** — the only spendable currency. Found, looted, sold-for, quest-rewarded.
- **Renown** — a reputation, not a wallet. Grows from waking towns, quests, and restorations; unlocks better stock, wandering merchants, conveniences. Never spent — it gates.

**Faucets → sinks:**

```
Earn:  enemy drops (bounded) · chests & breakables · selling surplus gear
       · foraging woken-town produce · quest rewards
Spend: consumables · gear (weapons/armor/charms) · charm upgrades
       · skill respec at the shrine · town restoration
```

**Shops are data**, reusing the §16 condition/effect vocabulary (stock gated by renown/flags/quests — no new machinery):

```ts
interface Shop { id; vendor; stock: StockEntry[]; }
interface StockEntry { item: string; price: number; stock?: number; when?: Condition[]; }
interface ItemDef { id; name; kind:'consumable'|'weapon'|'armor'|'charm'|'material'|'key';
                    value; desc; effects?: Effect[]; stats?: Record<string,number>; }
```

`openShop` is an Effect dialogue fires; buying deducts coin + runs `giveItem`; selling reverses it.

**Signature cozy sink — town restoration.** Each woken town has restoration projects (repair the mill, replant the orchard, clear the well). Each costs coin (later, materials), and finishing one flips a flag that unlocks a service, discount, forage spot, or quest — visibly bringing the place back. The same emotional loop as ringing the bell, now player-paced.

**MVP scope (Thistledown):** Coin only; Maple’s store sells two consumables (**bell-pear preserve** heals, **resonant draught** restores Echoes) and one starter charm, and buys surplus; coin trickles from sprites/breakables + first-quest reward; respec cost stub at the hearth. Seed **one** restoration project (clear the brambles from Maple’s cellar → expands her stock) so the loop is visible from town one. Defer renown tiers, foraging, materials/crafting, and the full restoration system to post-MVP.

## 20. Open questions / TODO

- Spec the Wildstrider and Bellsinger trees node-by-node.
- Design Region 2 and the tool that gates it (the next traversal verb).
- Exact combat numbers, enemy HP/damage tuning, XP curve values.
- Save-system specifics (what persists; hearth as save point).
- Charm/gear affix system depth.
- Audio plan and a placeholder soundtrack.
