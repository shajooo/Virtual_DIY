# CardboardCAD — Project Specification

> Working title: **CardboardCAD**  
> Product type: Lightweight 2D/3D CAD and assembly planner  
> Primary use: Designing, measuring, assembling, and documenting cardboard prototypes and simple physical objects.

## 1. Product goal

Build one easy-to-use application in which a user can create 2D sketches and 3D primitives in the same main window, convert 2D profiles into 3D parts, assemble multiple parts, define how they are joined, and later inspect each individual component as a dimensioned 2D drawing.

The application should feel like a small, approachable CAD tool—not a general-purpose drawing app and not a collection of separate windows.

### Core design principle

**An assembly must preserve the identity of every component.** Joining two components must not permanently fuse them into one unselectable object. The user must still be able to select, double-click, inspect, edit, hide, isolate, and generate a drawing for each original part.

## 2. Main workflow

1. Create a new project.
2. Choose **2D Sketch** or **3D Model** from the same workspace.
3. Draw a 2D profile such as a rectangle, circle, or polygon and enter exact dimensions.
4. Select the profile and choose **Extrude / Add Thickness** to create a 3D part. The extrusion distance is the third dimension; it must not overwrite the sketch's original width or height.
5. Create additional parts, or add 3D primitives directly.
6. Position parts in the 3D viewport.
7. Select two parts and create a connection such as glue, screw, bolt, tape, hinge, or tab-and-slot.
8. Double-click any part in the assembly to open its component details.
9. Generate a 2D drawing for that individual part, with front/top/side views and dimensions.
10. Save the project and optionally export drawings.

## 3. Main application layout

Use one main application window with a persistent CAD workspace.

### 3.1 Top menu bar

Provide conventional menus:

- **File:** New, Open, Save, Save As, Export, Project Information, Exit.
- **Edit:** Undo, Redo, Cut, Copy, Paste, Duplicate, Delete, Select All.
- **View:** 2D Sketch View, 3D View, Split View (if practical), Top, Front, Back, Left, Right, Bottom, Isometric, Fit All, Grid, Axes, Properties Panel.
- **Create:** 2D Rectangle, Circle, Polygon; 3D Box/Cuboid, Cylinder, Sphere, Cone.
- **Sketch / Part:** Edit Sketch, Extrude / Add Thickness, Edit Dimensions, Convert to 3D.
- **Assembly:** Create Assembly, Add Component, Create Join, Edit Join, Break Join, Exploded View (later phase).
- **Help:** Shortcuts, Getting Started, About.

### 3.2 Toolbars

Provide compact toolbars for common actions: select, move, rotate, sketch tools, primitive tools, extrude, join, fit view, and view orientation. Tooltips should explain each icon.

### 3.3 Workspace

The centre of the window is the main 2D/3D viewport. It must support:

- Switching between 2D sketch and 3D model views without opening another window.
- A visible grid and axes, with configurable grid spacing.
- Zoom, pan, orbit (3D), and fit-to-content.
- Selection highlighting and a clear selected-object outline.
- Top/front/side orthographic views and an isometric/perspective view.
- A split view is desirable, but not required for the first usable version.

### 3.4 Left panel — creation and project tree

Include a collapsible panel with:

- **Create 2D:** Rectangle, Circle, Polygon.
- **Create 3D:** Box/Cuboid, Cylinder, Sphere, Cone.
- **Project tree:** Sketches, Parts, Assemblies, and Joints.
- Each part must have a distinct name and stable internal ID.
- Tree selection and viewport selection must stay synchronized.

### 3.5 Right panel — properties / inspector

Show editable properties for the selected object. The panel should update when the selection changes.

For a 2D sketch:

- Name and object type.
- Width/length and height, where applicable.
- Radius/diameter, where applicable.
- Position and rotation.
- Units and constraint status, if supported.

For a 3D part:

- Name and primitive/profile type.
- Width, depth, height, and/or thickness as appropriate.
- Corner radius for rounded boxes, where applicable.
- Cylinder radius/diameter and height.
- X, Y, Z position and rotation.
- Material/appearance label (for example cardboard, wood, acrylic, or custom).
- Connected joints and the names of other connected components.

For a joint:

- Join type.
- Connected component A and component B.
- Connection position/anchor information.
- Type-specific parameters such as screw diameter/count or hinge axis.
- Break/Edit Join actions.

### 3.6 Bottom status bar

Show current mode, selected object, units, grid/snap status, and pointer coordinates where practical.

## 4. Geometry and object creation

### 4.1 Units

- Default unit: millimetres (mm).
- Allow switching to centimetres (cm).
- Keep values internally consistent; changing display units must not change actual geometry.
- Allow decimal measurements and sensible precision.
- Display units beside dimension fields.

### 4.2 2D sketch tools

First-version tools:

- Rectangle: width and height.
- Circle: radius or diameter.
- Polygon: number of sides and size, if feasible.

Requirements:

- Create a sketch on the XY plane.
- Enter dimensions numerically after creation and edit them later.
- Display dimension annotations in sketch view.
- Support grid snapping and optional snap-to-endpoint/centre.
- Support selecting, moving, rotating, renaming, duplicating, and deleting a sketch.

### 4.3 Convert 2D to 3D

A selected closed 2D profile must offer **Extrude / Add Thickness**.

- Ask for an extrusion distance (thickness/depth/height along the extrusion axis).
- Preserve the original 2D width and height.
- Preview the resulting solid before confirming.
- Keep a link to the source sketch so the part can be edited later.
- Editing the source sketch or extrusion distance should update the generated part.
- The new solid becomes an independent component in the project tree.

### 4.4 3D primitive tools

First-version primitives:

- Box / Cuboid: width, depth, height.
- Cylinder: radius or diameter, height, and radial segment quality.
- Sphere: radius or diameter.
- Cone: base radius, top radius if practical, and height.

Additional requirements:

- Allow numeric dimensions at creation and in the properties panel.
- Box/cuboid must support an optional corner radius (rounded corners). A zero radius produces sharp corners.
- Geometry must update when a dimension is edited.
- Parts must support position and rotation transforms.
- Each created primitive is a separate named component.

## 5. Assembly and joining system

### 5.1 Component-preserving assembly

An assembly is a collection of separate component objects with their own geometry, parameters, transforms, and IDs.

- Joining components creates a **joint/connection relationship** between them.
- Do not destructively merge their meshes by default.
- Components remain individually selectable in the viewport and project tree.
- Users can hide, show, isolate, rename, edit, or remove a component after joining.
- Breaking a joint removes the connection relationship without deleting either component.

### 5.2 Join types

Provide these join types in the first version where feasible:

| Join type | Expected behaviour |
|---|---|
| Glue | Fixed connection between two parts; optionally display a glue-line/adhesive marker. |
| Screw | Fixed connection with one or more visible screw markers and editable count/diameter. |
| Bolt | Fixed connection with bolt markers and editable count/diameter. |
| Tape | Fixed connection with a visible tape strip/marker. |
| Hinge | Rotational connection around a defined axis; allow changing the hinge angle. |
| Tab-and-slot | Connection marker/relationship representing an inserted tab; dimensions can be recorded. |

At minimum, implement **Glue** and **Screw** as functioning connection records in the first usable version. Other join types can be added incrementally, but they should be represented in the data model so the design can grow.

### 5.3 Creating a join

Suggested interaction:

1. Select component A.
2. Ctrl-click component B, or use a Create Join command that asks for component B.
3. Choose the join type in a compact dialog or inspector section.
4. Set the connection point/face and type-specific parameters.
5. Preview the connection marker.
6. Confirm to create the joint.

If precise face selection is too large for the first version, provide a simple anchor-point workflow and document the limitation.

### 5.4 Transform behaviour

- Users can position and rotate components before joining.
- A fixed join should preserve the relative transform of the connected parts when the assembly is moved as a whole.
- Moving one connected part should either move the connected group or warn that the user is editing a constrained part; do not silently break the join.
- Provide an explicit Break Join / Detach action.

## 6. Inspecting an individual component after assembly

This is a critical feature.

- Single-click selects a component.
- **Double-clicking a component** in the viewport or project tree opens/focuses its Component Inspector.
- Highlight the chosen component and show its editable parameters.
- Show its dimensions, position, rotation, source sketch (if any), material label, and connected joints.
- Provide **Isolate Component** and **Show All** actions.
- Provide **Create 2D Drawing for This Part**.

The component drawing should be generated from that component's geometry—not from the entire assembly—and should include, where applicable:

- Front view.
- Top view.
- Left/right or side view.
- Overall dimensions and relevant radii/diameters.
- Component name and unit label.

Do not confuse the 2D drawing of a component with the 2D projection of the entire assembly. The user must be able to inspect each component independently even after it has been joined to other components.

## 7. Navigation and keyboard shortcuts

Implement standard shortcuts and show them in menu labels/tooltips.

| Shortcut | Action |
|---|---|
| Ctrl + N | New project |
| Ctrl + O | Open project |
| Ctrl + S | Save project |
| Ctrl + Shift + S | Save As |
| Ctrl + Z | Undo |
| Ctrl + Y or Ctrl + Shift + Z | Redo |
| Ctrl + C / Ctrl + V | Copy / Paste |
| Ctrl + D | Duplicate selected object |
| Delete | Delete selected object (confirm if it has joints) |
| Escape | Cancel current tool/selection operation |
| F | Fit all objects in view |
| 1 | Front view |
| 2 | Top view |
| 3 | Right view |
| 0 | Isometric view |

Keyboard shortcuts must not fire while the user is typing in a text field, numeric input, or text editor. Undo/redo must cover geometry edits, transformations, object creation/deletion, and join operations.

## 8. File handling and export

First version:

- Save the entire project to a versioned native project file, for example `.ccad` (JSON-based internally).
- Open a previously saved project and restore parts, sketches, dimensions, transforms, assemblies, and joints.
- Save As must allow a new project path/name.
- Warn before closing or opening another project when unsaved changes exist.

Useful exports:

- Export an individual 2D component drawing as SVG or PDF.
- Export a 2D sketch profile as SVG.
- DXF export is a desirable later addition.
- Export a 3D view as PNG is optional.

## 9. Visual and interaction design

- Clean, minimal, professional CAD interface.
- Neutral light or dark theme; prioritize legibility and clear dimension labels.
- One main window, no unnecessary modal windows for routine property editing.
- Use clear icons with text labels or tooltips.
- Numeric fields should be easy to select and edit.
- Selected objects and active tools must be visually obvious.
- Keep the viewport large; panels should be resizable/collapsible if practical.
- Use consistent spacing, typography, and control styles.

## 10. Data model requirements

Use a structured, versioned document model. At minimum, represent:

- `Project`: project metadata, units, settings, and collections.
- `Sketch`: stable ID, name, plane, 2D entities, dimensions, transform, and visibility.
- `Part`: stable ID, name, geometry definition, source sketch reference if applicable, primitive parameters, transform, appearance, and visibility.
- `Assembly`: stable ID, name, and component references.
- `Joint`: stable ID, type, component A/B IDs, anchor data, relative transform, and type-specific parameters.

A part's dimensions must be stored as editable parameters, not inferred only from a baked mesh. The 3D mesh is a representation generated from those parameters.

## 11. Suggested technical approach for the first version

A local-first application is sufficient; no account system or backend is needed for the MVP.

Suggested stack:

- React + TypeScript + Vite for the single-window GUI.
- Three.js for 3D rendering and camera controls.
- SVG-based 2D sketch viewport and dimension annotations.
- A small state store with a deliberate undo/redo history.
- Versioned JSON project serialization for save/open.
- Geometry helper modules for primitives and extruded sketch profiles.

The app does not need to compete with professional parametric CAD software in its first version. Prioritize reliable primitive geometry, simple sketch extrusion, component-preserving assemblies, editable dimensions, and per-component 2D drawings.

## 12. MVP acceptance criteria

The first usable build is complete only when all of the following work:

1. The app opens to one coherent CAD window with menus, a viewport, a project tree, and a properties panel.
2. A user can create a dimensioned 2D rectangle and circle.
3. A user can edit the 2D dimensions after creation.
4. A user can extrude a closed 2D profile into a 3D part by entering thickness/depth.
5. A user can create a cuboid and cylinder with custom dimensions; rounded cuboid corners are supported or explicitly marked as a follow-up.
6. Each created part remains a separate component with a stable identity.
7. A user can position at least two parts and create a Glue or Screw join record between them.
8. Joined parts remain individually selectable.
9. Double-clicking a joined part opens its inspector and displays its own dimensions and properties—not the dimensions of the whole assembly.
10. A user can generate a 2D drawing for one selected component, independent of the complete assembly.
11. Ctrl+S, Ctrl+Z, and redo work reliably.
12. Save, close, reopen, and verify that the project restores its geometry and connections.

## 13. Development order

### Phase 1 — Core workspace

- Single-window UI.
- Project tree and properties panel.
- Units, grid, selection, camera navigation.
- 2D rectangle/circle creation and editing.
- 3D cuboid/cylinder creation and editing.
- Save/open project.
- Undo/redo.

### Phase 2 — 2D-to-3D workflow

- Extrude closed sketch profiles.
- Editable source-sketch references.
- Rounded box corners and additional primitives.
- Dimensioned orthographic views.

### Phase 3 — Assemblies

- Multiple components and transforms.
- Component-preserving assembly model.
- Glue and screw joints.
- Double-click component inspector.
- Per-component drawing generation.

### Phase 4 — Further joining and export

- Bolt, tape, hinge, tab-and-slot joints.
- SVG/PDF export and later DXF export.
- Improved snapping, face/edge selection, and exploded views.

## 14. Important implementation constraints

- Do not build only a static UI mockup; the core actions must work.
- Do not use placeholder buttons for required MVP actions.
- Do not destructively merge joined components.
- Do not lose the source sketch or editable dimensions after extrusion.
- Do not show the overall assembly dimensions when the user asks to inspect one component.
- Do not allow display-unit changes to alter physical dimensions.
- Keep the code modular, typed, and documented so more shapes and join types can be added later.
- Include a README with setup, run, build, and usage instructions.
