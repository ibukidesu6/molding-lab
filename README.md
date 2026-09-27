# MOLD LAB — 射出成形ラボ

A Web game where you learn how injection molding works just by playing (React + TypeScript + Vite).

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs to dist/ (static hosting)
```

## Structure

```
src/
  game/            UI-independent game logic (pure TS)
    types.ts       Type definitions
    params.ts      Molding conditions (range, unit, order)
    materials.ts   Material data (PP / ABS / PC)
    missions.ts    Stage definitions
    simulate.ts    Conditions → fill / flash / sink judgment + fix hints
    timeline.ts    Animation duration of each process step
    mascot.ts      Teacher cat: which line / motion clip for each situation
    progress.ts    Progress save and unlocks (localStorage)
  i18n/
    locales/ja.ts  Japanese (source of truth; the Dict type is generated from it)
    locales/en.ts  English (type-checked against Dict)
    index.tsx      Language registry and useI18n()
  components/      UI (Stage = machine + transparent-mold SVG, Mascot = teacher cat + speech bubble, etc.)
public/mascot/     Teacher-cat clips (VP9-alpha .webm for Chrome/Firefox, HEVC-alpha .mp4 for Safari) + idle.png
```

## How to extend

- **Add a language**: create `locales/zh.ts` as `const zh: Dict = {...}` and add it to `LOCALES` in `i18n/index.tsx`. Missing keys become type errors.
- **Add a stage**: append to `MISSIONS` in `game/missions.ts` and add strings under `missions.<id>` in each language.
- **Add a material**: add it to `MaterialId` / `MATERIALS` and to `materials` in each language.
- **Add a teacher-cat clip** (e.g. ④ think / ⑥ again): put the green-screen clip in `mascot-kit/clips/NN.mp4`, run `mascot-kit/process.sh` (keys out the background → `out/NN.webm`) and then `mascot-kit/export-game.sh` (crops and writes `public/mascot/<name>.webm` + Safari `.mp4`). Finally add the name to `READY_CLIPS` in `game/mascot.ts`; until then a similar clip stands in.
- **Add or change a teacher-cat line**: which line plays when is decided in `game/mascot.ts` (`resultLines` etc.); the words live under `coach` in each locale.
- **Add a defect**: add it to `DefectId`, add the judgment to `simulate.ts`, and add strings to `outcomes`. Add drawings to `Stage.tsx` / `ProductArt.tsx` / `CauseDiagram.tsx`.

## Model (simplified)

- Flow index = push (pressure × speed) × runniness (melt temp, mold temp, material). Below 1 → **short shot**
- Flash index = pressure/speed too strong for the clamp (worse when the resin is very runny). 1 or more → **flash**
- Sink index = max(cooling time needed ÷ cooling time, packing needed ÷ packing). 1 or more → **sink**

The coefficients are tuned for game play and are not real process values.
