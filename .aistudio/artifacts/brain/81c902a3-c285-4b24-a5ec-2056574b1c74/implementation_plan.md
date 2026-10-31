# Implementation Plan - SV-006 Surface Selection & Coating Visualisation

Implement Milestone SV-006 to provide surface selection and coating visualisation on top of captured survey photographs in SmartView Pro.

---

## Proposed Changes

### 1. Surface Selection & Coating Engine (`src/lib/surfaceVisualizationEngine.ts`)
- Data structures for surface selections, assigned paint colors/finishes, and original vs preview image versioning.
- Methods for manual touch point selection, polygon boundary region drawing, and AI-assisted segmentation simulation.

### 2. Surface Selection & Coating Visualisation Modal / Screen (`src/components/SurfaceVisualizerWorkspace.tsx`)
- Interactive photo viewer supporting:
  - Original capture view vs. Proposed coating preview view.
  - Multi-method surface selection toolbar (Manual touch, Polygon boundary, AI Segmentation).
  - Palette presets (Walnus Global Professional Exterior) + Custom HEX color picker.
  - Save selections and preview history against survey capture records.

### 3. Integration with Survey Workspace (`src/components/SurveyWorkspace.tsx` & `src/components/SurveyCaptureGallery.tsx`)
- Add a "Visualise & Paint" action button on survey captures to launch the `SurfaceVisualizerWorkspace`.

### 4. Automated Verification (`tests/sv006_surface_visualization.test.ts`)
- Unit tests verifying surface selection CRUD, version history, and coating color assignment.
- Linter and build verification (`tsc --noEmit` and `compile_applet`).

---

## Verification Plan

### Automated Tests
- Run `npx tsx tests/sv006_surface_visualization.test.ts`.
- Run SV-003 and SV-004 test suites.
- Run `tsc --noEmit` and `compile_applet`.

### Manual Verification
- Verify loading survey capture photos, selecting surfaces via touch/polygon/AI, assigning palette/custom colors, and toggling Original vs Preview views.
