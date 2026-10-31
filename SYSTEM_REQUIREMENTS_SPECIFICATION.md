# Software Requirements Specification (SRS)
## Walnus SmartView Pro

---

## 1. Introduction

### 1.1 Purpose
This document specifies the software requirements for **Walnus SmartView Pro**. It defines the functional and non-functional requirements, user interface constraints, and system interactions necessary to support structural estimation and factory production bridging.

### 1.2 Scope
Walnus SmartView Pro is a mobile-first web application enabling field engineers to perform spatial area takeoffs, calculate material formulations (paint, screed, plaster) adjusted for weather, and sync these formulations to a factory production queue. The system includes an AI Copilot, real-time communications, and offline-first state management.

---

## 2. Overall Description

### 2.1 User Classes and Characteristics
1. **Field Engineers/Estimators:** Primary mobile users. Require high-contrast, uncluttered interfaces usable with one hand. Focus on camera AR, environmental scanning, and rapid data entry.
2. **Factory Operators:** Primary tablet/desktop users. Focus on the `MixerApp` queue, inventory charts (D3.js), and fulfilling incoming batches.
3. **Project Managers & Stakeholders:** Users relying on the Chat System, Video Conference, and Google Workspace exports for oversight and approval.

### 2.2 Operating Environment
- **Platform:** Modern Web Browsers (Chrome, Safari, Edge) running in a responsive, mobile-first container or PWA context.
- **Hardware Abstraction:** Relies on HTML5 APIs for Camera (`getUserMedia`), Geolocation, and local storage mechanisms.

---

## 3. Functional Requirements (FRs)

### FR-1: Immersive Job Certification Gate
- **FR-1.1:** Upon initial load, the system MUST present an AI Copilot Onboarding Gate blocking access to the workspace.
- **FR-1.2:** The user MUST certify the project discipline (Paint, Screed, or Plaster).
- **FR-1.3:** The system MUST persist this certification locally and auto-configure the corresponding material algorithms, UI icons, and unit measurements.

### FR-2: Spatial & Neural Estimation
- **FR-2.1:** The system MUST provide an immersive camera canvas allowing users to capture site photos.
- **FR-2.2:** The system MUST simulate Neural 3D point cloud generation (NeRF/Gaussian Splatting) to calculate wall and floor surface area (sq ft / sq m).
- **FR-2.3:** The system MUST support dynamic toggling between Camera View, Mesh Overlay, and Split Screen modes.

### FR-3: Environmental Engine (Weather Copilot)
- **FR-3.1:** The system MUST allow users to input or retrieve local environmental data (Temperature, Humidity, Wind, Substrate Moisture).
- **FR-3.2:** The formulation engine MUST mathematically adjust material requirements (e.g., adding retarders for high heat, accelerators for cold) based on the environmental data.

### FR-4: Factory Mixer Synchronization
- **FR-4.1:** Field formulations MUST be transmittable to the Factory Mixer queue as standard JSON payloads.
- **FR-4.2:** The Mixer Terminal MUST display a D3-powered visual chart of current raw material inventory vs. required stock.
- **FR-4.3:** The system MUST alert the operator if a requested batch exceeds current chemical additive thresholds.

### FR-5: Collaboration & Export
- **FR-5.1:** The system MUST include a sliding Chat Drawer for multi-channel communication.
- **FR-5.2:** The system MUST provide a simulated Video Conference modal for remote site walk-throughs.
- **FR-5.3:** The system MUST generate structured Markdown/PDF/Doc stakeholder summaries for external sign-off.

---

## 4. Non-Functional Requirements (NFRs)

### 4.1 UI/UX & Design Constraints
- **Tactical Dark Aesthetic:** The application MUST utilize a dark mode color palette (Slate 900/950 backgrounds) to reduce glare in outdoor field environments.
- **Mobile-First Layout:** All panels MUST be constrained by responsive max-widths, utilizing absolute/fixed positioning for floating action buttons (FABs) and bottom-sheet drawers.
- **Feedback & Micro-interactions:** The system MUST use `motion/react` for fluid state transitions and provide subtle auditory feedback (clicks, chimes) for crucial actions (if enabled by browser policies).
- **Clutter Reduction:** Extraneous tools MUST automatically minimize into a hovering stack to preserve maximum real estate for the camera viewfinder.

### 4.2 Performance
- **Fluid Animation:** UI transitions MUST target 60FPS. Heavy calculations (simulated 3D mesh processing) MUST NOT block the main UI thread (utilize asynchronous React state updates or Web Workers conceptually).
- **Cold Boot:** The application MUST load to an interactive state (cache-first) in under 1.5 seconds on standard 4G networks.

### 4.3 Reliability & Availability
- **Offline-First Persistence:** The system MUST utilize `localStorage` (or IndexedDB) to continuously auto-save field parameters, draft site payloads, and active chat states every 5-15 seconds. Data MUST survive accidental browser refreshes.

### 4.4 Security
- **API Key Handling:** Any integrations with real LLMs (Gemini) or Workspace APIs MUST enforce server-side routing (or strictly managed OAuth client tokens) to prevent secret leakage in the client bundle.
- **Sandboxed Execution:** The application MUST NOT rely on insecure `eval()` operations for formulation mathematics.
