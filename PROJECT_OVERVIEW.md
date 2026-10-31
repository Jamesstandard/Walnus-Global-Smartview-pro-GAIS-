# Walnus SmartView Pro - Project Overview

## 1. Executive Summary
**Walnus SmartView Pro** (also known as SiteView Pro) is a professional, mobile-first, full-stack application designed for on-site structural estimation, material formulation, and field-to-factory synchronization. Built with a "tactical, dark workspace" aesthetic, the platform bridges the gap between on-site spatial measurements (using AR and Neural 3D meshing) and industrial production (factory mixer routing, raw material inventory).

## 2. Core Value Proposition
- **Precision Field Estimation:** Replaces manual tape measurements with spatial camera views and Neural 3D surface meshing to calculate exact surface areas and required material volumes.
- **Dynamic Formulation:** Adjusts material requirements (Paint, Screed, Plaster) in real-time based on live environmental telemetry (Temperature, Humidity, Wind Speed) via the Weather Copilot.
- **Factory Synchronization:** Seamlessly transmits field-approved formulas directly to the factory mixer queue, tracking raw material stock (Binders, Pigments, Additives) in real-time.
- **Stakeholder Collaboration:** Integrates embedded chat, Google Workspace synchronization, and video conferencing to keep clients, field engineers, and factory operators aligned.

## 3. Primary Modules

### 3.1. Field Estimator Console (`EstimatorApp`)
- **Immersive Spatial Canvas:** A camera-driven viewfinder with overlaid AR grids and HUD elements.
- **Neural 3D Generator:** Renders point clouds (Gaussian Splatting) and volumetric meshes (NeRF/Poisson) to extract precise wall and floor dimensions.
- **Project Execution Modes:** Context-switching between **Architectural Paint** (volume/gallons), **Floor Screed** (thickness/bags), and **Wall Plaster** (depth/bags).
- **Weather Copilot Scheduler:** A floating panel that pulls environmental data to adjust curing times, viscosity, and application windows.

### 3.2. Factory Mixer Terminal (`MixerApp`)
- **Production Queue:** Manages incoming formulation payloads from the field, allowing factory operators to process batches.
- **D3 Inventory Analytics:** Real-time visual tracking of raw material stock (Titanium Dioxide, Calcium Carbonate, Polyurethane Binders).
- **Automated Alerts:** Triggers threshold warnings when chemical additive packages drop below critical operational capacity.

### 3.3. AI Copilot & Orchestration (`AICopilotDrawer` / `ImmersiveJobCertificationModal`)
- **Pre-Initiation Gate:** Requires operators to certify their job type (Paint, Screed, Plaster) before the workspace unlocks, calibrating algorithms to the specific discipline.
- **Autonomous Agents:** Specialized AI sub-agents capable of running QA audits, generating stakeholder summaries, and analyzing spatial discrepancies.

### 3.4. Communication & Workspace (`ChatSystem`, `VideoConferenceModal`)
- **Encrypted Channels:** Real-time text channels organized by site, formulation, and logistics.
- **Live Video Connect:** WebRTC-ready interface for instant visual validation of site conditions with remote supervisors.
- **Export & Sync:** Google Workspace integration for exporting specifications to Sheets/Docs and driving formal stakeholder sign-offs.

## 4. Technical Architecture Strategy
- **Frontend Framework:** React 18+ (Functional Components, Hooks) configured with Vite.
- **Styling:** Tailwind CSS (Utility-first, heavily reliant on `slate`, `indigo`, `emerald`, and `rose` color palettes for the tactical HUD feel).
- **Animation:** `motion/react` for fluid, physics-based interactions (spring minimize, drawer slides).
- **Data Persistence:** Offline-first architecture using `localStorage` and modular DB wrappers to ensure field operators don't lose data in low-connectivity environments. Auto-save triggers every few seconds.
- **Mobile-First UX:** Touch-optimized targets (48x48dp minimum), bottom-sheet drawers, and thumb-zone navigation to accommodate operators wearing PPE or holding devices with one hand.
