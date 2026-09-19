# Creature Quest Academy v6 — Production Blueprint

Status: Active rebuild
Target: iPhone + iPad Safari, landscape-first
First world: Amazon Rainforest — Lost Baby Sloth
Visual goal: polished original 2D children's platform-adventure, not a webpage skin

## Product direction
Creature Quest Academy v6 is a ground-up rebuild. The playable scene must dominate the screen. Normal gameplay should contain almost no prose. Learning appears at contextual discovery moments, then immediately returns the player to movement and exploration.

## Core mission loop
1. Enter a habitat from the mobile field base.
2. Explore by walking, jumping, climbing, scanning, and collecting.
3. Discover animals and gather adaptation data.
4. Complete short learning interactions tied to the current mission.
5. Unlock an original Creature Ability mode.
6. Use the ability to traverse a new section of the level.
7. Rescue or restore the habitat.
8. Celebrate, award XP/collectibles, and store first-attempt learning data.

## First playable mission
Amazon Rainforest — Lost Baby Sloth

Sequence:
- Start at WildLab camp.
- Walk to scanner station and calibrate it.
- Find and scan poison dart frog.
- Cross the lower river platforms.
- Find and scan toucan.
- Reach the canopy route.
- Find and scan adult sloth.
- Unlock Sloth Ability.
- Traverse vine/claw route.
- Locate the baby sloth.
- Complete final field-note learning challenge.
- Rescue and reunion celebration.

## Camera
- Landscape-first.
- Player occupies roughly 10–13% of screen height.
- Camera follows horizontally with dead-zone smoothing.
- Foreground and background move at different rates.
- Short camera shake for impacts.
- Camera never jumps during educational overlays.

## Visual stack
Layer 0: atmospheric sky gradient and mist.
Layer 1: distant pale canopy silhouettes.
Layer 2: large mid-distance trees and branches.
Layer 3: playable terrain and water.
Layer 4: animals, player, collectibles, mission props.
Layer 5: foreground leaves, grass, vines, particles.
Layer 6: minimal HUD and touch controls.

## Art production rules
- Original art only.
- Cohesive cartoon rendering across every asset.
- No raw emoji in finished gameplay art.
- No flat CSS rectangles as primary scenery.
- Terrain needs texture: soil bands, roots, stones, moss, edge grass, highlights and shadows.
- Trees need bark grooves, branch silhouettes, leaf clustering and ground shadows.
- Animals need readable silhouettes and species-specific markings.
- Player needs a consistent sprite identity and multiple motion states.

## Asset groups
### Backgrounds
- rainforest_sky
- rainforest_far_canopy
- rainforest_mid_canopy
- rainforest_tree_columns
- rainforest_foreground_leaves
- rainforest_mist

### Terrain
- grass_edge_straight
- grass_edge_left
- grass_edge_right
- dirt_platform_small
- dirt_platform_medium
- dirt_platform_large
- cliff_wall
- roots_overlay
- moss_overlay
- stone_cluster
- log_bridge
- vine_wall
- river_surface
- waterfall

### Props
- WildLab base
- field scanner
- creature data pod
- checkpoint marker
- rescue marker
- power disc
- canopy branch
- hanging vine

### Player animation set
- idle: 6–8 frames
- run: 8 frames
- jump up: 2 frames
- fall: 2 frames
- land: 3 frames
- interact/scan: 4–6 frames
- transform: 8–12 frames
- sloth ability idle/run/jump/grip

### Animals
- poison dart frog idle
- toucan idle
- adult sloth idle
- baby sloth idle
- rescue reunion animation

### Effects
- scan beam
- data sparkles
- discovery burst
- transformation ring
- leaf particles
- dust puffs
- water splashes
- landing puff
- rescue celebration

## UI
Normal gameplay:
- three creature-data lights
- current power icon
- pause/parent icon
- no mission paragraph
- no score text covering the world

Contextual interactions:
- scanner/animal discovery panel
- learning question
- creature fact
- short character reaction
- one-tap return to gameplay

Parent dashboard:
- first attempts only
- accuracy by skill
- recent misses
- sufficient-sample handling before labeling a skill weak
- separate retry-success tracking
- local Safari storage with export backup

## Mobile controls
- translucent directional control left.
- jump uses upper D-pad direction.
- action/power button right.
- touchstart/touchend with preventDefault.
- controls float over world rather than resizing it.
- safe-area aware.
- landscape uses full viewport.
- portrait remains playable but landscape is recommended.

## Engineering architecture
- fixed logical world coordinates independent of device pixels.
- responsive canvas scale.
- delta-time movement.
- camera smoothing.
- object/entity model with update/draw/interact hooks.
- collision rectangles separate from artwork.
- asset preload manager with progress state.
- persistent state isolated from render state.
- mission state machine.
- learning-event logger records immutable first attempt.
- retry state is stored separately from mastery score.
- world/mission content stored as data rather than hard-coded UI flow.

## v6 milestone gates
Milestone 1 — engine foundation
- responsive full-screen canvas
- player movement
- camera
- collision
- touch controls
- layered background
- mission state
- first-attempt analytics

Milestone 2 — art integration
- replace procedural fallback art with illustrated assets
- player animation set
- terrain tiles
- animals
- props
- effects

Milestone 3 — first complete mission
- WildLab through baby sloth rescue
- learning interactions
- Sloth Ability
- rewards
- parent dashboard

Milestone 4 — polish
- audio cues
- particles
- animation timing
- camera feel
- transitions
- performance pass on iPhone/iPad Safari

## Acceptance standard
The build does not pass merely because it works. It passes when screenshots of normal gameplay read immediately as a children's 2D platform game rather than a website, quiz, or technical prototype.
