# Cow and Horse

A small 3D office stealth-comedy game built with Three.js.

## Core fantasy

It is 18:00. Get out of the office without being caught by someone who can give you more work.

The current playable slice includes:

- 10-second pre-escape phase around the workstation
- third-person office stealth
- standing, crouching and sprinting
- height-aware cover and obstacle-clipped vision cones
- NPC office routines, suspicion, chase and recovery
- cinematic shoulder-tap capture sequences
- overtime minigames
- time and energy as failure resources
- timed elevator extraction
- desktop and touch controls

## Graybox editor

The game and editor are the same web app.

Open the normal game and press **EDIT** (or `Tab`), or open with:

```text
?edit=1
```

The editor supports:

- placing office prefabs and gameplay markers
- selecting, moving and rotating objects in 3D
- editing desk / wall / room dimensions
- navigation nodes and edge authoring
- NPC routine nodes with office actions and dwell times
- fake-work / hide / distraction interaction markers
- live level validation
- Save Draft to localStorage
- Import / Export JSON
- Duplicate and switch levels
- Revert to the published version
- Publish the level JSON directly to GitHub
- recent playtest path overlays

All level content lives in:

```text
public/levels/*.json
```

The runtime no longer contains a code-authored office layout.

## Design loop

```text
paper encounter
      ↓
EDIT graybox
      ↓
Validate
      ↓
PLAY
      ↓
review player trail / stealth timing
      ↓
adjust
      ↓
Save Draft or Publish
      ↓
GitHub Actions
      ↓
validate-level + validate-stealth + build
      ↓
GitHub Pages
```

## Local development

```bash
npm install
npm run dev
```

Controls in Play Mode:

- `WASD` / arrow keys: move
- `Shift`: sprint
- `C`: crouch / stand
- `R`: restart after win/failure
- `Tab`: enter editor

Editor shortcuts:

- `W`: translate
- `E`: rotate
- `Delete`: remove selected item
- `Ctrl/Cmd + D`: duplicate selected item
- `Tab`: playtest current graybox

## Publishing from the web editor

GitHub Pages cannot inherit ChatGPT or local GitHub credentials. The Publish dialog therefore accepts a fine-grained GitHub token at runtime. Use a token limited to this repository with Contents write permission.

The token is not written into source code or localStorage.

## Stack

- Three.js
- Vite
- HTML/CSS UI overlays
- JSON-authored levels
- GitHub Actions + GitHub Pages
