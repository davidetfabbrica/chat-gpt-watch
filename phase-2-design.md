# Phase 2: Refactor
## High-level goal

- Separate engraving + printing from motion + light.

- If something doesn’t move in a real watch, it must not be redrawn every frame.

## 1. Canvas Stack (mental model)

We will have three conceptual layers, implemented with two canvases:


### Live Canvas (on screen) : redrawn every frame
 - hands
 - moon rotation
 - sidereal hand
- breathing light pass

### Static Dial Canvas : drawn once
- enamel base
- guilloché geometry
- minute track
- applied indices
- Roman numerals
- logo + subtitle
- Swiss Made arc
- subdial outlines
- date window frame

The user only ever sees one canvas, but we composite internally.

## 2. File scope (still one file for now)

We’ll keep everything in app/page.tsx for simplicity, but structure it as if it were multi-file.

 **Top-level sections (in order)**
1. Constants & geometry
2. Utility math
3. Static dial renderer
4. Guilloché generator
5. Dynamic renderers (hands, moon, sidereal)
6. Animation loop
7. React wiring

This ordering is a requirement, must be enforced

## 3. Geometry contract
Define these once, and never recompute
```
const SIZE = 500;
const CENTER = SIZE / 2;
const RADIUS = SIZE * 0.45;

const TRACK_RADIUS = RADIUS * 0.98;
const INDEX_RADIUS = RADIUS * 0.82;
const LOGO_Y = CENTER - RADIUS * 0.35;
```

Every dial element references these.

This alone prevents:
- date window drift
- subdial misalignment
- disappearing tracks

## 4. Static dial renderer
**Function signature**
```
function renderStaticDial(ctx: CanvasRenderingContext2D)
```
This function:

- clears its canvas
- draws everything that never animates
- is called once<br>

### Draw order (locked)
  
- Enamel base
- Guilloché geometry
- Minute track
- Applied indices
- Roman numerals
- Subdial outlines
- Date window frame
- Logo text
- Subtitle text
- “Swiss Made” arc

⚠️ No gradients, no animation, no clipping leaks.

## 5. Guilloché implementation (static, for now)
### Separate function
```
function drawGuilloche(ctx)
```
**Important:**

- Drawn inside a dial clip
- Uses math curves, not gradients
- Produces a height illusion, not stripes

For now:
- monochrome
- no breathing
- no lighting

This lets us tune pattern density safely.

## 6. Breathing light (dynamic, safe)
### Separate pass
```
function drawDialLight(ctx, time)
```
This does only one thing:
- Draw a translucent luminance mask over the static dial

**Constraints:**

Uses `globalCompositeOperation = "multiply"`

- Never clips
- Never clears
- Never touches geometry

Light motion:
- single slow sine wave
- period ~15s
- amplitude ~1–2%

This cannot break layout by design.

## 7. Dynamic elements (isolated)

Each moving element gets its own function:
```
drawHourMinuteHands(ctx, time)
drawGmtHand(ctx, time, offset)
drawMoon(ctx, time)
drawSidereal(ctx, time)
```
**Rules:**

- No fills that cover large areas
- No clipping
- No state leakage (save/restore always)

## 8. Animation loop (simple, boring, correct)

Every frame:

- Clear visible canvas
- Draw static dial canvas
- Draw breathing light
- Draw dynamic elements

## 9. Performance guarantees

This architecture ensures:

- Guilloché is drawn once
- Roman numerals never reflow
- Text never shifts
- Performance stays constant even as visuals improve

This is how we safely add:

- moon texture
- star twinkle
- polished hand gradients
- sapphire distortion later
