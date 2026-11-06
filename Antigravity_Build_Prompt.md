# Antigravity Prompt — Build CardboardCAD

Act as a senior product engineer and CAD application developer. Build a working first version of **CardboardCAD**, a lightweight 2D/3D CAD and assembly planner for designing cardboard prototypes and simple physical objects.

The complete product requirements are in `CardboardCAD_Project_Specification.md` in this project. Read that file first and treat it as the source of truth.

## Primary outcome

Create a functional application—not just a mockup—with one main GUI where I can:

1. Draw dimensioned 2D shapes.
2. Create 3D primitives with editable dimensions.
3. Convert a closed 2D shape into a 3D part by adding thickness/extrusion depth.
4. Assemble multiple separate 3D parts.
5. Join parts using connections such as glue and screws.
6. Double-click any part after assembly to inspect that individual part's dimensions and properties.
7. Generate a separate 2D drawing of an individual part even though it belongs to an assembly.
8. Save and reopen the complete project.

## Before coding

1. Inspect the existing project directory and its current files.
2. Read `CardboardCAD_Project_Specification.md` completely.
3. If a project already exists, preserve useful working code and adapt it rather than overwriting it blindly.
4. If the directory is empty, initialize the project using the stack below.
5. Create a short implementation checklist, then proceed directly to building the application. Do not stop after producing a plan.

## Recommended implementation stack

Unless the existing project has a good reason to use another stack, use:

- React + TypeScript + Vite.
- Three.js for the 3D viewport, geometry, and camera controls.
- SVG for the 2D sketch viewport, dimension lines, and dimension labels.
- A lightweight state-management solution with explicit undo/redo history.
- Versioned JSON serialization for the native project file.
- Vitest or an equivalent test runner for core data-model and geometry tests.

Keep the first version local-first. Do not add accounts, cloud storage, a backend, or subscriptions.

## Required GUI

Build one cohesive CAD workspace with:

- A conventional top menu bar: File, Edit, View, Create, Sketch/Part, Assembly, Help.
- A compact toolbar for selection, drawing, primitive creation, extrusion, transform, joining, and view controls.
- A collapsible left panel containing creation tools and the project/component tree.
- A large central viewport that can switch between 2D sketch mode and 3D model mode.
- A right-side properties inspector that edits the selected object's parameters.
- A bottom status bar displaying current mode, units, and useful selection/grid information.

Use a polished, restrained CAD aesthetic. Keep the viewport as the dominant area. Avoid dashboard-style cards and oversized decorative elements. All important controls need real behavior and tooltips.

## Geometry behaviour

### 2D

Implement at minimum:

- Rectangle with editable width and height.
- Circle with editable radius/diameter.
- Dimension annotations.
- Grid, snapping, selection, move, rename, duplicate, and delete.

### Convert 2D to 3D

A closed 2D profile must have an **Extrude / Add Thickness** action. Ask for an extrusion distance and create a 3D solid. Preserve the original 2D width and height; extrusion distance is the third dimension, not a replacement for either sketch dimension. Keep a source-sketch reference so the solid can be edited later.

### 3D primitives

Implement at minimum:

- Box/cuboid: width, depth, height, optional corner radius.
- Cylinder: radius/diameter and height.
- Sphere: radius/diameter.
- Cone: base radius and height if practical.

Dimensions must be editable numerically after creation and geometry must update when parameters change. Each object must be a separate named component with a stable ID.

## Critical assembly rule

**Never destructively merge joined parts by default.**

The assembly must contain references to separate components. Each component retains its own geometry definition, editable dimensions, transform, name, and ID. A join is a separate relationship record between components.

Implement at least these functioning join types in the first usable build:

- Glue: fixed connection record, with a visible connection marker or seam where feasible.
- Screw: fixed connection record, with editable screw count/diameter and visible screw markers where feasible.

Design the data model so Bolt, Tape, Hinge, and Tab-and-slot can be added without restructuring the whole app. Allow the user to select two components, choose a join type, configure basic parameters, and confirm the connection. Provide Edit Join and Break Join actions.

If precise face picking is too complex for the first version, use a clearly explained anchor-point workflow. Do not pretend that unsupported face constraints exist.

## Individual part inspection — highest priority

Implement the following exact interaction:

- Single-click selects a part.
- Double-clicking a part in the 3D viewport or project tree opens/focuses that component's inspector.
- The inspector must show that component's own width, depth, height/thickness, radii/diameters, position, rotation, source sketch, and connected joints as applicable.
- Add Isolate Component and Show All actions.
- Add **Create 2D Drawing for This Part**.

The generated drawing must describe only the selected component, not the entire assembly. Provide front, top, and side orthographic views with dimensions where applicable. Keep the component selectable and editable while it is joined to other parts.

## Editing, navigation, and file operations

Implement standard commands:

- Ctrl+N: New.
- Ctrl+O: Open.
- Ctrl+S: Save.
- Ctrl+Shift+S: Save As.
- Ctrl+Z: Undo.
- Ctrl+Y or Ctrl+Shift+Z: Redo.
- Ctrl+C/Ctrl+V: Copy/Paste where supported.
- Ctrl+D: Duplicate.
- Delete: Delete selected object, with a warning if it has joints.
- Escape: Cancel the current tool.
- F: Fit all.
- 1: Front, 2: Top, 3: Right, 0: Isometric.

Do not trigger global shortcuts while focus is inside an input, textarea, or editable text control.

Use millimetres as the default unit and allow switching to centimetres without changing the underlying physical dimensions.

Save the full project—including sketches, parts, parameters, transforms, assemblies, joints, units, and visibility—to a versioned native project file such as `.ccad`. Opening a saved file must restore the same project. Warn before discarding unsaved changes.

Provide SVG export for individual 2D drawings if feasible in the first version. PDF and DXF can follow later.

## Data architecture

Create typed, modular data structures for:

- Project.
- Sketch and 2D entities.
- Part and parametric geometry definition.
- Assembly and component references.
- Joint and type-specific parameters.
- Selection and viewport state.

Store dimensions as editable parameters; do not rely only on baked mesh dimensions. Generate display geometry from the parameter definitions. Use stable IDs and validate references when loading a project.

Undo/redo must cover object creation, deletion, geometry parameter changes, transforms, and join creation/edit/removal. Prefer predictable document-state commands or immutable snapshots over ad hoc UI-only undo.

## Quality requirements

- TypeScript strict mode where practical.
- Modular components and geometry utilities.
- Clear error handling for invalid dimensions, broken references, and malformed project files.
- Prevent zero/negative dimensions where they are invalid.
- Do not silently lose components or joints.
- Keep the application responsive for a modest number of parts.
- Add tests for dimension updates, 2D extrusion, project save/load, join references, and undo/redo.
- Add a README with installation, development, build, and basic usage instructions.

## Build order

Implement in this order and keep the application runnable after each phase:

1. App shell, menu bar, panels, viewport, project tree, and properties inspector.
2. 2D rectangle/circle creation, dimensions, grid, selection, and editing.
3. 3D cuboid/cylinder creation and editable dimensions.
4. Extrude a 2D closed profile into a separate 3D part.
5. Project save/open and undo/redo.
6. Assembly component model and transforms.
7. Glue and screw join records and markers.
8. Double-click component inspector, isolate/show all, and per-component 2D drawings.
9. Tests, error handling, README, and build verification.

If time or implementation constraints force prioritization, finish a smaller end-to-end working flow rather than leaving many nonfunctional buttons. The minimum end-to-end demonstration must be: create a 2D rectangle → set its dimensions → extrude it → create a second 3D part → position both → glue or screw them together → double-click one part → see that part's own dimensions → generate its individual 2D drawing → save and reopen the project.

## Final verification and report

Before finishing:

1. Run the available tests.
2. Run the production build and fix build errors.
3. Launch the app and verify the minimum end-to-end demonstration.
4. Check that joining does not fuse component identities.
5. Check that individual drawings show only the selected component.
6. List what works, what is incomplete, and the exact command to run the app.

Do not claim a feature is complete unless it has been implemented and verified. Start by inspecting the project and reading the specification, then build.
