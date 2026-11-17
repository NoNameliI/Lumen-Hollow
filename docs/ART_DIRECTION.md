# Lumen Hollow — Art Direction

## Mood

A quiet forest at night. Cold blue and blue-green dusk everywhere; the only warm colour is the
amber light of the lanterns and the Heart-tree. **Light is the hero**: whatever matters glows,
whatever does not sinks into shadow. Silhouettes must read instantly at a glance.

Rules of thumb:

- Low saturation, strong value contrast, soft gradients.
- No pure white and no bright cartoon colours. Highlights use `bone` or a light tint of the local light.
- No visible grid, no hard outlines. Edges come from value and rim light, not strokes.
- Warm = friendly (towers, tree, gold). Cold lilac/cyan = the Hollow. Muted red only for damage and the last life.
- Everything moves a little (sway, breathing, drifting fog), but `Reduce motion` stops wobble, sway and shake.

## Palette

Base colours live in `src/render/palette.ts` (`P`):

| Role | Colours |
| --- | --- |
| Night | `ink #05060d`, `night #0a0f1f`, `deep #121a2e` |
| Vegetation, stone, wood | `moss #1c2b25`, `mossLight #2f4636`, `stone #474b57`, `bark #2b2119` |
| Warm accent | `amber #ffb347`, `amberGlow #ffd88a`, `ember #c8641e` |
| Magic | `teal #3f9e98`, `tealGlow #8fe6da`, `frost #9fd6ff`, `storm #b7a4ff`, `spore #a6dc7e` |
| The Hollow | near-black violet bodies, eyes `lilac #c4abff` / `cyan #8eeaff` |
| Danger | `danger #b5434c`, `dangerGlow #ff7a7a` (rare) |

### Biomes (`BIOME`)

Each biome is a colour-grade shift of the same world, not a different art style.

| Biome | Ground ramp | Darkness | Grade (soft-light) | Fog | Feel |
| --- | --- | --- | --- | --- | --- |
| Meadow | dark moss greens | `#050912` @ 0.50 | green `#4f8a72` @ 0.10 | thin | twilight with a hint of green |
| Marsh | blue-green, wet | `#030d0e` @ 0.58 | teal `#2f9e94` @ 0.13 | dense | mist over still water |
| Cliffs | grey-violet stone | `#080714` @ 0.54 | lilac moonlight `#958bd0` @ 0.12 | thin | cold moonlit rock |
| Dusk Wood | near black blue | `#02030a` @ 0.64 | deep blue `#3a52a8` @ 0.14 | dense | almost black, rare accents |

Long shadows fall in a fixed per-biome direction (`BIOME[b].shadow`).

## Lighting rules

- Every tower carries its own light (`TOWER_LIGHT`): amber Sparkshooter, ember Boomcap, cold blue
  Frostbloom, electric violet Storm Reed, dim warm Owl Perch, swamp green Mold Garden, wide warm Beacon,
  soft yellow Firefly Jar. Flames flicker with noise, never with a regular sine.
- The Heart-tree is the strongest light on the map and dims as lives are lost.
- Projectiles, explosions, lightning and spells light their surroundings briefly.
- Enemies are dark; only their eyes/cores emit a little cold light. Bosses carry one strong emissive element.
- Selected-tower range is shown as a soft glowing ring, never as a flat fill.

## Render layers

`src/render/index.ts` orchestrates one frame (see the contract in `src/render/rctx.ts`):

1. **Ground cache** (offscreen, once per level): low-frequency noise ground, moss and litter patches,
   the smoothed path (Catmull-Rom over densified waypoints) with ragged noisy edges and pebbles,
   the rune plaza around the Heart-tree, spawn portals, flat decor with contact shadows.
2. **Live ground**: rune glow on the plaza, portal mist, swamp shimmer, zones (puddles, starfall marks), decals.
3. **Shadows**: contact shadows for everything, long shadows for towers and the tree.
4. **Bodies, y-sorted**: towers, walking enemies, the Heart-tree; then flyers, projectiles, world particles.
5. **Map frame**: dark tree and bush silhouettes around the borders, gently swaying branches.
6. **Lighting**: a half-resolution darkness buffer filled with the biome darkness; lights are cut out
   with soft radial sprites (`destination-out`), then the same lights are added in colour (`lighter`).
7. **Fog**: 1–3 tileable noise layers drifting at different speeds; beacons clear it.
8. **Emissive**: lantern cores, enemy eyes, projectile cores, sparks, the tree's lights (`lighter`).
9. **Bloom**: the coloured light buffer downsampled to 1/8 and added back (cheap blur by scaling).
10. **Post**: biome grade (`soft-light`), vignette, optional film grain.
11. **Readable overlays**: build grid, range rings, ghost tower, spell targeting, HP bars, numbers.
12. **Screen effects**: frost-nova flash, leak vignette, victory/defeat wash.

## Performance budget

Target: 60 FPS with ~300 enemies on High.

| Preset | Light buffers | Bloom | Fog layers | Grain | Particle cap | Smoke trails |
| --- | --- | --- | --- | --- | --- | --- |
| Low | 1/4 | off | 1 | off | 300 | off |
| Medium | 1/2 | on | 2 | off | 600 | on |
| High | 1/2 | on | 3 | on | 900 | on |

- Static layers (ground, map frame, fog textures, enemy and tower sprites, glow sprites) are cached.
- No gradients are created per entity per frame: draw cached glow sprites with `drawImage`.
- The renderer measures frame time and steps the preset down when the average stays under ~45 FPS.

## Effects list

- Build: tower rises from the ground with dust and a pulse of light. Upgrade: flash and orbiting sparks.
  Sell: the tower breaks into motes of light.
- Shots: recoil and muzzle flash; projectiles with trails and their own light; explosions with a
  shockwave ring, sparks and a small camera kick; branching chain lightning with impact flashes;
  poison as curling spores.
- Enemies: smoke trails, death as a silhouette dissolving upward into motes, a golden spark flying
  toward the gold counter; boss arrival with a wave of darkness, shake and a short hit-stop.
- Numbers: small, fading, coloured by damage type; crits slightly larger with a pulse. Can be turned off.
- Spells: Starfall (falling stars, flashes, glowing craters), Frost Nova (expanding ice wave with
  crystals), Gold Rush (golden motes rising).
- Wave start: a band of fog rolls in from the entrances. Victory: the tree flares. Defeat: it goes dark.
- Ambient: fireflies, drifting fog, swaying branches, falling leaves, an occasional owl shadow.

## Interface

Dark glass panels with thin amber lines, 6–10 px radius, `backdrop-filter` blur where supported.
Headings use a serif stack (Georgia, "Times New Roman", serif) with letter spacing; numbers and
labels use the system sans stack. Icons are thin-line inline SVG with a soft glow on hover.
