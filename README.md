# CardboardCAD

Lightweight 2D/3D CAD and assembly planner for cardboard prototypes.

## Requirements
- Node.js 18+
- pnpm (recommended) or npm

## Installation
```bash
pnpm install
```

## Development
```bash
pnpm dev
# Opens at http://localhost:5173
```

## Build
```bash
pnpm run build
# Output in dist/
```

## Tests
```bash
pnpm test
```

## Usage
### Quick start
1. Open the app — a blank project loads automatically.
2. Switch to **2D** mode (toolbar toggle) and draw a rectangle or circle.
   - Set exact dimensions in the right-side Inspector.
3. Select the shape, press **E** (or Sketch/Part → Extrude) and enter thickness to create a 3D part.
4. Switch to **3D** mode and use orbit controls (left-drag to rotate, right-drag to pan, scroll to zoom).
5. Create a second 3D part via Create → Box or Cylinder.
6. Select one part, Ctrl+click another, press **J** (or Assembly → Create Join) to join them.
7. Double-click any part to open its Component Inspector.
8. In the Inspector, click **Create 2D Drawing** to view and export an orthographic drawing.
9. Press **Ctrl+S** to save the project as a `.ccad` file.

### Keyboard shortcuts
| Key | Action |
|---|---|
| Ctrl+N | New project |
| Ctrl+O | Open project |
| Ctrl+S | Save |
| Ctrl+Shift+S | Save As |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+D | Duplicate |
| Delete | Delete selected |
| E | Extrude selected 2D shape |
| J | Create join between selected parts |
| F | Fit all in view |
| 1/2/3/0 | Front/Top/Right/Isometric view |
| Escape | Cancel tool / deselect |

## Project file format
Projects are saved as `.ccad` files (JSON internally). Schema version is stored in `meta.version`.

## Architecture
- `src/types/` — TypeScript data model
- `src/store/` — Zustand state stores with undo/redo
- `src/geometry/` — Pure geometry builders (Three.js BufferGeometry)
- `src/serialization/` — .ccad save/load
- `src/components/` — React UI (layout, viewport, inspector, dialogs)
- `src/hooks/` — Keyboard shortcuts, history helpers
- `src/utils/` — IDs, units, validation, file storage

## Known limitations (v0.1)
- Polygon sketch tool not yet implemented
- DXF export is a planned future addition
- Hinge, Bolt, Tape, Tab-slot joints defined in data model but UI creation not yet available
- Face/edge-based snapping uses anchor-point workflow in first version
