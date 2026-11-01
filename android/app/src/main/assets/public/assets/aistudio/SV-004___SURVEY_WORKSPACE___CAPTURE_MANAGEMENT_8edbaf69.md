WALNUS SMARTVIEW PRO™

AGENTIC DEVELOPMENT LIFECYCLE

SV-004 — SURVEY WORKSPACE & CAPTURE MANAGEMENT

1. TASK

Implement the SmartView Pro Survey Workspace on top of the completed SV-003 camera/capture subsystem.

SV-003 is considered the foundation and must NOT be unnecessarily rewritten.

The objective of SV-004 is to establish the first coherent survey workflow:

Dashboard → New Survey → Survey Workspace → Capture → Review → Survey Data

The application must remain functional offline.

---

2. SV-004 SUCCESS CRITERIA

SV-004 is complete when a user can:

1. Open SmartView Pro.
2. Start a new survey.
3. Enter basic project/survey information.
4. Enter the survey workspace.
5. Access the camera from the workspace.
6. Capture photographs using the SV-003 camera pipeline.
7. Return to the workspace without losing survey state.
8. View captured images associated with the active survey.
9. Review individual captures.
10. Delete unwanted captures.
11. Close the application.
12. Reopen it.
13. Continue accessing previously created surveys and captures.
14. Navigate between the major SmartView Pro sections without dead links or dead UI controls.

---

3. IMPORTANT IMPLEMENTATION RULE

DO NOT rebuild SV-003.

Reuse the existing:

- CameraX implementation
- camera lifecycle handling
- preview
- image capture
- local/private storage
- capture persistence
- survey association mechanisms already implemented

SV-004 is an integration and workspace layer.

If an SV-003 component requires a small correction for integration, correct it rather than duplicating it.

---

4. UI DIRECTION

The SmartView Pro interface must now begin to look like an actual professional field-survey application rather than a collection of development screens.

Maintain the established SmartView visual language:

- dark professional interface
- high information density without clutter
- clear hierarchy
- premium technical appearance
- subtle futuristic/HUD influence
- large touch targets
- strong contrast
- restrained cyan/technical accent treatment
- survey/project information presented as structured data
- camera remains a major interaction
- avoid decorative UI that does not contribute to field work

The interface must work properly on ordinary Android phones.

Do NOT sacrifice usability for visual effects.

---

5. PRIMARY NAVIGATION

Implement the agreed SmartView Pro navigation structure.

Core areas:

HOME / DASHBOARD

Displays:

- SmartView Pro identity
- New Survey
- Recent Surveys
- Survey count/status
- quick access to active/recent work

SURVEYS

Displays existing surveys.

Each survey should expose:

- project name
- client/site information
- creation date
- survey status
- capture count

ACTIVE SURVEY

Displays the currently selected survey and provides access to:

- Survey information
- Camera
- Captures
- Survey data
- future measurement functions

CAMERA

Launches the existing SV-003 camera pipeline.

CAPTURES

Displays photographs belonging to the current survey.

---

6. NEW SURVEY

Create a proper New Survey workflow.

Minimum fields:

- Project / Survey Name
- Client Name
- Site Address / Location
- Surveyor Name
- Notes

Optional fields may include:

- Project Reference
- Client Contact
- Project Type

Do not over-engineer the form.

The user must be able to create the survey quickly in the field.

---

7. SURVEY WORKSPACE

The workspace is the central SV-004 screen.

Suggested hierarchy:

HEADER

Display:

SMARTVIEW PRO

Current survey/project name

Survey status

Location indicator where available

---

PROJECT CARD

Show:

- Project name
- Client
- Location
- Survey date
- Surveyor

---

ACTION GRID

Primary actions:

📷 CAPTURE

Open camera.

🖼 CAPTURES

View captured photographs.

📐 SURVEY DATA

Reserved for measurement/geometry functionality in subsequent lifecycle stages.

📋 PROJECT INFO

Edit/view survey information.

Future functions must have clear extension points but must NOT be falsely presented as implemented.

---

8. CAPTURE EXPERIENCE

Use the SV-003 camera implementation.

When the user captures an image:

1. Capture image.
2. Persist image.
3. Associate image with active survey.
4. Update capture count.
5. Return/retain the user within the survey workflow.
6. Make the new image immediately visible in Captures.

The system must not lose the active survey because the camera activity/screen is opened.

---

9. CAPTURE GALLERY

Implement a clean field-oriented gallery.

Display:

- thumbnail grid
- capture count
- capture timestamp
- survey association

Selecting an image opens a larger preview.

Available actions:

- View
- Delete

Deletion must require confirmation.

Do not permanently delete files until the application has safely removed the associated capture record according to the existing persistence architecture.

---

10. SURVEY PERSISTENCE

Survey state must survive:

- screen navigation
- activity recreation
- application closure
- application restart

At minimum persist:

Survey
 ├── id
 ├── projectName
 ├── clientName
 ├── siteAddress
 ├── surveyorName
 ├── notes
 ├── createdAt
 ├── updatedAt
 └── status

Captures:

Capture
 ├── id
 ├── surveyId
 ├── localFilePath
 ├── capturedAt
 └── metadata

Reuse the existing SV-003 data architecture where applicable.

Do NOT create duplicate databases or parallel persistence systems.

---

11. LOCATION

Where location services are available, expose the survey's location appropriately.

Do not make GPS acquisition block survey creation.

If GPS is unavailable:

- allow the survey to continue
- indicate that location is unavailable
- allow location to be acquired later

Do not fabricate coordinates.

---

12. OFFLINE-FIRST REQUIREMENT

SV-004 must function without internet access.

The following must work offline:

- create survey
- edit survey
- open survey
- capture images
- view captures
- delete captures
- reopen previous surveys

Network functionality can be introduced in later lifecycle stages.

---

13. UI STATE REQUIREMENTS

Every major screen must account for:

Loading

Show appropriate loading state.

Empty

Example:

«No surveys yet.

Start your first site survey.»

Error

Provide understandable recovery action.

Offline

Do not display misleading connection failures when the requested operation is entirely local.

Permission denied

Explain the required permission and provide a recovery path.

---

14. NAVIGATION VALIDATION

SV-003 testing exposed an important issue:

Some visible page links/UI elements were not responding.

SV-004 MUST explicitly test every visible interactive control.

For every button/card/navigation item:

Tap → expected destination/action occurs.

No decorative buttons pretending to be functional.

If a feature is not yet implemented, clearly mark it as:

- Coming Soon
- Future Module
- Locked/Reserved

rather than silently doing nothing.

---

15. BACK NAVIGATION

Android back navigation must behave predictably.

Examples:

Camera → Survey Workspace

Capture Preview → Captures

Captures → Survey Workspace

Survey Workspace → Surveys/Dashboard

Do not allow accidental destruction of active survey state.

---

16. DESIGN LANGUAGE

The UI should feel like:

Professional surveying technology + construction intelligence + modern AI-assisted field software.

Avoid:

- generic banking UI
- generic CRUD dashboard
- excessive gradients
- oversized decorative cards
- unnecessary animations
- fake AI terminology
- meaningless HUD graphics

HUD elements should communicate information, not merely decorate the screen.

---

17. EXTENSION ARCHITECTURE

Prepare clean extension points for later SmartView modules:

SV-005 and beyond may introduce:

- geometry detection
- surface recognition
- measurement
- compass
- GPS/site mapping
- paint estimation
- material estimation
- quotation
- reporting
- AI analysis

Do NOT implement these prematurely in SV-004.

The workspace should nevertheless make their eventual integration obvious.

---

18. TEST PLAN

TEST 1 — CREATE SURVEY

Create a survey with realistic project information.

Expected:

Survey appears in Surveys and opens correctly.

TEST 2 — OPEN WORKSPACE

Open survey.

Expected:

Correct project information displayed.

TEST 3 — CAMERA

Open Camera.

Expected:

SV-003 camera works correctly.

TEST 4 — CAPTURE

Take photograph.

Expected:

Image is stored and associated with current survey.

TEST 5 — MULTIPLE CAPTURES

Take several photographs.

Expected:

All appear in gallery.

TEST 6 — REVIEW

Open capture.

Expected:

Correct photograph displayed.

TEST 7 — DELETE

Delete capture.

Expected:

Capture disappears from gallery and persistence is updated correctly.

TEST 8 — RESTART

Close application completely.

Reopen.

Expected:

Survey and captures remain available.

TEST 9 — OFFLINE

Disable network.

Repeat core workflow.

Expected:

Core survey functionality remains operational.

TEST 10 — NAVIGATION AUDIT

Tap every visible navigation/action control.

Expected:

No dead buttons or broken routes.

---

19. REGRESSION REQUIREMENT

SV-003 must remain functional after SV-004.

Before declaring SV-004 complete, verify:

- camera preview
- camera lifecycle
- capture
- image persistence
- survey association
- app restart behaviour

No SV-004 change should regress SV-003.

---

20. COMPLETION REPORT

When finished, return:

SV-004 COMPLETION REPORT

Task ID

SV-004

Task Title

Survey Workspace & Capture Management

Implementation Summary

Files/Modules Changed

Database/Persistence Changes

UI Screens Implemented

Navigation Implemented

SV-003 Regression Test

Offline Test

Device Test

Known Issues

Deferred Features

Overall Status

PASS / PASS WITH NOTES / FAIL

Recommended Next Lifecycle Stage

Provide the proposed objective for SV-005.

---

21. DEFINITION OF DONE

SV-004 is DONE only when SmartView Pro has moved from:

"camera subsystem that works"

to:

"a user can actually conduct and manage a basic digital site survey."

The camera remains the foundation.

The Survey Workspace becomes the operational shell around it.

Do not proceed into advanced measurement/AI functionality merely to make the stage appear larger.

Build the foundation correctly.