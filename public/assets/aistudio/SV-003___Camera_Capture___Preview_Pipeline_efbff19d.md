SMARTVIEW PRO™ — SV-003 IMPLEMENTATION SPECIFICATION

Camera Capture & Preview Pipeline

Project: SmartView Pro™
Company: Walnus Global Ventures
Milestone: SV-003
Previous Milestone: SV-002 — Project Architecture Validation & Local Data Persistence Pipeline
Next Milestone: SV-004 — ARCore Spatial Session & Surface Plane Estimation
Status: READY FOR IMPLEMENTATION

---

1. OBJECTIVE

Implement the first real camera capability in SmartView Pro™ using Android CameraX.

SV-003 must establish a production-quality, lifecycle-aware camera subsystem that allows a user to:

1. Open the camera from an active survey.
2. View a live camera preview.
3. Capture a photograph.
4. Persist the captured image locally.
5. Associate the capture with the correct survey.
6. Retrieve previously captured images after application restart.
7. Operate completely offline.
8. Handle camera permissions and camera failures gracefully.

SV-003 is specifically a camera acquisition and local media persistence milestone.

It is NOT an AR milestone.

It is NOT an AI milestone.

It is NOT a measurement/geometry milestone.

It is NOT a quotation-generation milestone.

---

2. ARCHITECTURAL PRINCIPLE

The existing SV-002 architecture must remain intact.

The intended architectural flow is:

UI
 ↓
ViewModel
 ↓
Repository / Camera Abstraction
 ↓
CameraX + Local Media Storage
 ↓
Local Filesystem / Room Metadata

Existing persistence remains:

Project
   ↓
Survey
   ↓
Measurement

SV-003 adds:

Survey
   ↓
SurveyCapture / MediaRecord
   ↓
Local Image File

CameraX implementation details must NOT leak into domain models or unrelated UI components.

---

3. REQUIRED TECHNOLOGY

Use the project's existing Android/Kotlin/Compose architecture.

Use:

- CameraX
- "Preview"
- "ImageCapture"
- "ProcessCameraProvider"
- lifecycle-aware camera binding
- Android runtime camera permission handling
- local application storage

Do not introduce a second camera framework.

Do not implement the camera using obsolete "Camera" APIs.

Do not add ARCore in SV-003.

---

4. SCOPE

4.1 Camera Preview

Implement a dedicated camera screen capable of displaying a live camera preview.

Requirements:

- Preview must occupy the appropriate camera viewport.
- Camera lifecycle must follow the screen lifecycle.
- Camera must stop/release appropriately when leaving the screen.
- Camera must not continue consuming camera resources when the camera screen is no longer active.
- Preview must survive normal Compose recomposition without repeatedly creating camera sessions.

---

5. CAMERA CAPTURE

Implement still-image capture using CameraX "ImageCapture".

The user must be able to:

Open Survey
    ↓
Open Camera
    ↓
Preview scene
    ↓
Press Capture
    ↓
Image saved locally
    ↓
Capture associated with Survey

The capture operation must:

- create a unique filename;
- save to application-controlled storage;
- record the capture timestamp;
- associate the capture with the active Survey;
- return a domain-level capture result;
- expose capture success/failure to the UI.

The filename must NOT rely solely on the current clock value.

Use a collision-resistant identifier such as UUID or equivalent.

---

6. LOCAL STORAGE

Images must be stored locally.

The implementation must not require:

- internet access;
- cloud storage;
- Firebase;
- remote image hosting;
- external APIs.

The application must remain fully functional offline.

Prefer application-private storage for survey captures.

Do not write survey images to arbitrary public filesystem locations unless there is a documented technical reason.

---

7. MEDIA METADATA

The image file itself is not sufficient.

Create a domain/data representation for a survey capture.

A suitable conceptual model is:

SurveyCapture(
    id,
    surveyId,
    localPath,
    timestamp,
    captureType,
    width,
    height
)

Exact naming may follow the project's existing conventions.

At minimum the metadata must identify:

- capture ID;
- survey ID;
- local file location;
- capture timestamp;
- capture type;
- image dimensions where available.

The design must permit future metadata expansion.

---

8. ROOM INTEGRATION

Extend the existing Room architecture established in SV-002.

Add an appropriate entity, for example:

survey_captures

The exact name may follow project conventions.

Minimum conceptual schema:

survey_captures
------------------------------
id                  TEXT PK
survey_id           TEXT NOT NULL
local_path          TEXT NOT NULL
capture_type        TEXT NOT NULL
width               INTEGER
height              INTEGER
created_at_epoch_ms INTEGER NOT NULL

Relationship:

surveys
   |
   | ON DELETE CASCADE
   ↓
survey_captures

The "survey_id" must be indexed.

Deleting a Survey must remove its capture metadata.

The implementation must also define appropriate handling for the corresponding image files.

Do NOT leave orphaned media files without documenting the cleanup strategy.

---

9. REPOSITORY ABSTRACTION

Do not expose Room DAOs directly to the UI.

Create a repository abstraction appropriate to the project's architecture.

Conceptually:

interface SurveyCaptureRepository {

    fun getCapturesForSurvey(
        surveyId: String
    ): Flow<List<SurveyCapture>>

    suspend fun getCaptureById(
        id: String
    ): SurveyCapture?

    suspend fun saveCapture(
        capture: SurveyCapture
    )

    suspend fun deleteCapture(
        id: String
    )
}

The implementation may use different names/signatures if they fit the existing architecture better.

The architectural requirement is more important than the exact interface name.

---

10. CAMERA ABSTRACTION

CameraX-specific implementation should be isolated.

Do not make ViewModels depend directly on:

ProcessCameraProvider
ImageCapture
Preview
Camera

unless there is a compelling architectural reason.

Prefer a dedicated camera abstraction/controller/coordinator responsible for:

- camera initialization;
- preview binding;
- image capture;
- camera lifecycle;
- camera errors.

The UI should consume state and events rather than directly managing the complete camera lifecycle.

---

11. ACTIVE SURVEY CONTEXT

The camera must only be launched in the context of an identifiable Survey.

The implementation must not create captures with:

surveyId = null

or an arbitrary placeholder survey.

If no valid Survey exists:

- camera capture must not silently proceed;
- the UI must communicate the problem;
- no orphaned capture should be created.

The active Survey ID must flow explicitly through navigation/state.

---

12. CAMERA PERMISSIONS

Implement proper Android camera permission handling.

Required states:

Permission not granted

Display an appropriate permission request flow.

Permission granted

Initialize the camera.

Permission denied

Display a useful explanation/action state.

Permission permanently denied

Provide appropriate guidance for enabling the permission through Android settings where applicable.

Do not repeatedly request permission in an uncontrolled loop.

---

13. CAMERA ERROR HANDLING

The camera subsystem must handle failures gracefully.

Examples:

- camera unavailable;
- camera initialization failure;
- capture failure;
- storage failure;
- permission denial;
- lifecycle interruption;
- invalid active survey;
- insufficient storage.

Errors must be surfaced as application-level state.

Do not crash the application.

Do not swallow errors silently.

Do not report a capture as successful until the image has actually been persisted successfully.

---

14. CAPTURE STATE

Implement explicit UI state.

Conceptually:

Idle
Initializing
Ready
Capturing
CaptureSuccess
CaptureError
PermissionRequired
CameraUnavailable

Exact implementation can use the project's existing state architecture.

Avoid boolean combinations such as:

isLoading
isCapturing
hasError
permissionDenied
cameraReady

when they can result in contradictory states.

A coherent state model is preferred.

---

15. SURVEY CAPTURE SCREEN

Create a dedicated camera/capture UI.

The screen should include, at minimum:

- live camera preview;
- capture control;
- back/close control;
- camera initialization state;
- permission state;
- capture progress state;
- capture failure state.

The UI should remain visually consistent with the existing SmartView Pro™ application.

Walnus Global branding should remain intact.

Do not redesign the entire application.

---

16. CAPTURE REVIEW

After successful capture, provide a minimal confirmation/review experience.

The user should be able to determine that the image was successfully captured.

A simple flow is acceptable:

Camera
 ↓
Capture
 ↓
Preview / confirmation
 ↓
Return to survey

Do not build a full image-editing system.

Do not implement annotation tools.

Do not implement AI image analysis.

Those are future milestones.

---

17. CAPTURE GALLERY

Implement a basic way to retrieve captures associated with the current Survey.

This can be:

- a simple thumbnail list/grid;
- a survey capture section;
- or another architecture-consistent UI.

The important requirement is that captured images are retrievable from persistent application state.

After application restart:

Survey
 ↓
Captures
 ↓
Previously saved images

must still work.

---

18. IMAGE FILE LIFECYCLE

The implementation must explicitly handle the relationship between:

Room metadata
        +
physical image file

When deleting a capture:

1. Delete or otherwise invalidate its Room metadata.
2. Delete the associated local file when appropriate.
3. Handle file deletion failure safely.
4. Avoid silently creating permanent orphan files.

When deleting a Survey:

1. Room cascade removes capture records.
2. Associated image files must also be addressed.

Because Room cannot automatically delete filesystem files through foreign-key cascades, implement an appropriate application-level cleanup mechanism.

Document the strategy.

---

19. DATABASE VERSIONING

SV-002 established:

smartview_pro.db
Version 1

SV-003 introduces schema changes.

Therefore:

Increase the Room database version appropriately.

Do NOT use destructive migration merely to make the tests pass.

Implement an explicit migration from the SV-002 schema to the SV-003 schema.

For example:

Version 1
   ↓
Migration
   ↓
Version 2

The exact version number must reflect the actual repository state.

Add migration testing.

---

20. TESTING REQUIREMENTS

Tests are mandatory.

The implementation must preserve all existing SV-002 tests.

Add tests for:

Database

- capture entity insertion;
- capture retrieval;
- capture update if supported;
- capture deletion;
- survey/capture relationship;
- cascade deletion;
- database migration.

Repository

- save capture;
- retrieve captures by survey;
- retrieve capture by ID;
- delete capture;
- persistence across repository recreation;
- persistence across database reload.

ViewModel

Test appropriate camera/capture state transitions where hardware-independent.

UI

Test that the camera screen:

- renders;
- displays the appropriate permission state;
- displays loading/initializing state;
- responds to capture state;
- displays capture records where applicable.

---

21. HARDWARE TESTING RULE

Camera hardware cannot be truthfully simulated by a normal JVM unit test.

Therefore:

Do NOT claim:

«"Camera capture works on a physical device"»

unless an actual Android device/emulator with camera capability has been tested.

Tests may verify:

- state management;
- repository logic;
- Room;
- navigation;
- UI;
- abstractions;
- mocked/fake camera implementations.

If physical hardware is unavailable, explicitly report:

Physical camera verification: NOT PERFORMED

This is an acceptable result.

It is NOT a failed milestone by itself.

---

22. FAKE HARDWARE PROHIBITION

Do not create fake successful camera results and represent them as real camera captures.

Fake camera implementations may be used ONLY for automated tests.

The production implementation must use CameraX.

Do not:

- hardcode image paths;
- bundle a sample image and call it a capture;
- automatically generate fake measurements;
- claim camera hardware functionality based solely on unit tests.

---

23. SV-004 BOUNDARY

SV-003 must explicitly stop before AR.

Do NOT implement:

- ARCore;
- plane detection;
- surface anchors;
- world tracking;
- spatial mapping;
- 3D building reconstruction;
- depth estimation;
- AR measurement;
- geometry extraction.

These belong to SV-004.

The camera preview established here must nevertheless be architected so SV-004 can build upon it.

---

24. SV-004 HANDOFF REQUIREMENT

SV-003 should leave a clean extension point for:

CameraX Preview
       ↓
ARCore Session
       ↓
Plane Detection
       ↓
Spatial Surface Model

Do not tightly couple the CameraX implementation to future ARCore classes.

The camera acquisition layer should be reusable.

---

25. AI BOUNDARY

Do NOT implement:

- defect classification;
- paint recognition;
- AI colour recognition;
- AI surface classification;
- AI quantity estimation;
- LLM calls;
- computer-vision inference.

The captured image is an input asset for future intelligent processing.

SV-003 only establishes reliable acquisition and persistence.

---

26. NETWORK BOUNDARY

SV-003 must function without:

- internet;
- API keys;
- cloud services;
- authentication servers;
- remote storage.

No network permission should be introduced unless independently required by the existing application.

---

27. PERFORMANCE REQUIREMENTS

Camera startup should be asynchronous.

Do not block the main/UI thread with:

- camera initialization;
- image encoding;
- file operations;
- database writes.

Heavy operations must use appropriate coroutine/background execution.

Avoid memory-heavy loading of full-resolution images into Compose UI.

Use thumbnails/downsampling where appropriate for gallery display.

---

28. RESOURCE MANAGEMENT

Camera resources must be released correctly.

Verify:

- navigating away from camera;
- Activity recreation;
- lifecycle stop/start;
- permission changes;
- failed initialization;
- repeated camera opening/closing.

There must not be an accumulating set of camera bindings or background operations.

---

29. SECURITY / PRIVACY

Survey images may contain client property information.

Store them using application-private storage where possible.

Do not upload images anywhere.

Do not log image contents.

Do not log sensitive filesystem information unnecessarily.

Do not add analytics around image contents.

---

30. ARCHITECTURE ACCEPTANCE CRITERIA

SV-003 is accepted only if:

- [ ] CameraX is integrated.
- [ ] Live camera preview exists.
- [ ] Still image capture exists.
- [ ] Captures are associated with a valid Survey.
- [ ] Images are persisted locally.
- [ ] Capture metadata is persisted in Room.
- [ ] Capture metadata survives application restart.
- [ ] Existing SV-002 architecture remains intact.
- [ ] Room DAOs are not exposed to UI.
- [ ] CameraX implementation is appropriately isolated.
- [ ] Camera permissions are handled.
- [ ] Camera errors are handled.
- [ ] Capture failures do not produce false success.
- [ ] Survey deletion handles associated capture metadata.
- [ ] Image-file lifecycle is explicitly handled.
- [ ] Database migration is implemented.
- [ ] Migration is tested.
- [ ] Existing tests continue to pass.
- [ ] New SV-003 tests pass.
- [ ] No ARCore has been introduced.
- [ ] No AI inference has been introduced.
- [ ] No fake production camera has been introduced.
- [ ] No network dependency has been introduced.
- [ ] Physical-device verification status is honestly reported.

---

31. BUILD ACCEPTANCE

The agent must execute the appropriate project validation commands.

At minimum:

compile
test
assembleDebug

The exact Gradle commands should follow the project's existing configuration.

The final report must distinguish:

Compilation
Unit Tests
Instrumentation/Robolectric Tests
Database Migration Tests
APK Packaging
Physical Device Verification

Do not report a successful build if the build actually failed.

---

32. REGRESSION REQUIREMENT

SV-003 must not regress SV-002.

The following must continue working:

Project creation
Survey creation
Measurement persistence
Measurement provenance
Project retrieval
Survey retrieval
Repository abstraction
Room persistence
Cascade relationships
Offline operation
Existing navigation
Existing application shell

Run the complete existing test suite.

---

33. VERSIONING

Update the application's internal milestone/build identifier from:

SV-002

to:

SV-003

where appropriate.

Do not modify unrelated product/version semantics unnecessarily.

---

34. DOCUMENTATION REQUIREMENT

Create:

SV-003_COMPLETION_REPORT.md

The completion report must contain:

1. Task ID
2. Task title
3. Objective
4. Implementation summary
5. Architecture changes
6. Files created
7. Files modified
8. CameraX implementation
9. Storage implementation
10. Room schema changes
11. Migration details
12. Repository implementation
13. Permission handling
14. Error handling
15. Tests executed
16. Test results
17. Build results
18. UI verification
19. Offline verification
20. Physical-device verification status
21. Known issues
22. Deferred work
23. Final acceptance matrix
24. Git commit information

Do not omit failed tests or known limitations.

---

35. PROGRESS LEDGER

Update:

/PROGRESS.md

to record SV-003 completion status.

Do not mark SV-004 complete.

The next milestone must remain explicitly identified as:

SV-004 — ARCore Spatial Session & Surface Plane Estimation

---

36. GIT REQUIREMENT

Upon successful completion:

1. Review the complete diff.
2. Confirm no unrelated files or generated artifacts were accidentally committed.
3. Run the required tests/build.
4. Commit the complete SV-003 implementation.

Recommended commit format:

feat(sv-003): implement CameraX capture and local media pipeline

Record the actual commit hash in the completion report.

If no remote is configured, report that fact accurately.

Do not claim that code was pushed remotely unless an actual remote push succeeded.

---

37. DEFINITION OF DONE

SV-003 is DONE only when SmartView Pro™ has a genuine camera acquisition pipeline:

USER
  ↓
ACTIVE SURVEY
  ↓
CAMERA SCREEN
  ↓
CAMERAX PREVIEW
  ↓
CAPTURE
  ↓
LOCAL IMAGE FILE
  +
ROOM CAPTURE METADATA
  ↓
SURVEY CAPTURE HISTORY

The system must survive:

Camera close
Activity recreation
Application restart
Repository recreation
Database reload
Offline operation

without losing valid captured survey records.

---

38. FINAL AGENT INSTRUCTION

Implement SV-003 completely within the defined boundary.

Do not expand scope simply because future functionality is visible.

Do not implement ARCore early.

Do not implement AI early.

Do not create fake hardware functionality.

Do not rewrite stable SV-002 architecture unnecessarily.

If an architectural problem from SV-002 is discovered that genuinely blocks SV-003, document it first, make the smallest necessary correction, and explicitly record the change in the completion report.

The priority order is:

1. Correctness
2. Architectural integrity
3. Offline persistence
4. Testability
5. Hardware honesty
6. Maintainability
7. UI polish

SV-003 should leave SmartView Pro™ with a reliable photographic foundation upon which SV-004 can add spatial intelligence.

END OF SV-003 SPECIFICATION