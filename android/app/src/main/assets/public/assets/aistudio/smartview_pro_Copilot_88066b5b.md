SMARTVIEW-AI

Copilot Capability, Knowledge, Integration & Voice Specification

Application: SmartView Pro
Copilot: SmartView-ai
Platform: Existing Android application
Version: 1.0
Status: Implementation specification — repository audit required before development

---

1. Purpose and governing principles

SmartView-ai is an intelligent, application-integrated Copilot designed to understand, operate, configure, troubleshoot, and help users perform any operations supported by the application in which it is embedded.

It must be more than a conversational chatbot. It must function as a permission-aware control plane that can explain application features, inspect real application state, configure supported settings, orchestrate available tools and agents, use the shared knowledge base, and perform authorized actions through the application's actual services.

The implementation agent must treat this document as the design target, not as proof that every capability already exists.

1.1 Mandatory development principles

1. Inspect the existing repository before modifying code.
2. Preserve existing functionality, UI conventions, and demonstration flows.
3. Document every application feature and its real implementation status.
4. Use existing services, APIs, storage, and shared knowledge infrastructure where suitable.
5. Do not invent endpoints, integrations, assets, configuration options, or capabilities.
6. Use secure credential storage and explicit permissions.
7. Require confirmation for sensitive, destructive, externally visible, or irreversible operations.
8. Make every action observable, auditable, and recoverable where possible.
9. Provide graceful fallbacks when operations, models, tools, networks, or media-processing services fail.
10. Work in small, testable increments.
11. Do not replace, recreate, redesign, or rebuild the existing SmartView Pro application or Copilot.
12. Treat all work as an additive enhancement to the existing Android project.

1.2 Required workflow

Every implementation task must follow this sequence:

Task → Build → Test → Verify → Evidence → PASS → Next Task

A task cannot be marked PASS merely because code has been written. The agent must supply evidence that the feature works, identify the tests performed, and record any remaining limitations.

---

2. Application understanding and capability inventory

SmartView-ai must maintain an accurate understanding of SmartView Pro.

The initial product specifications, including "SYSTEM_REQUIERMENTS_SPECIFICATION.md" and "PROJECT_OVERVIEW.md", must be reviewed alongside the actual repository.

The agent must also inspect existing architecture, UI context, AI workflow, coding standards, progress records, and relevant implementation documentation.

Where documentation and implementation disagree, the agent must record the discrepancy instead of silently choosing one version.

2.1 Application modules to investigate

The implementation agent must inspect and document the following modules where they exist in the source specifications or repository.

1. SmartView-ai Copilot — conversations, application assistance, context, tools, permissions, and supported actions.
2. Camera and Capture System — camera preview, capture, image handling, camera configuration, and supported camera capabilities.
3. HUD and Camera Guidance — screen pointers, directional guides, measurement overlays, visual indicators, and supported augmented-reality assistance.
4. Device Capability Engine — device compatibility, hardware capability detection, performance configuration, and fallback behaviour.
5. Project Management — project creation, project details, and project organisation.
6. Survey Management — survey creation, survey records, site information, and survey workflows.
7. Measurement System — measurements, measurement records, provenance, accuracy indicators, and measurement validation.
8. Paint Workflow — the primary finishing and quotation workflow.
9. Screeding and Plastering Workflows — investigate their actual implementation and supported operations.
10. Material and Quantity Estimation — inspect available calculation, estimation, and material-planning functionality.
11. Quotation and Reporting — inspect quotation generation, reports, summaries, and supported export or sharing functions.
12. AI Agents and Background Services — inspect registered agents, their tasks, execution status, dependencies, and actual permissions.
13. Supplier and Price Research — inspect whether supplier discovery, material-price research, or related services are implemented.
14. Settings and Configuration — application preferences, supported configuration, permissions, and device options.
15. Subscription, Trial, and Premium Licensing — inspect the actual commercial access model and its implementation status.
16. Knowledge and Help System — inspect existing documentation, searchable knowledge, troubleshooting resources, and help functionality.
17. Voice and Media Assistance — inspect existing speech, text-to-speech, audio, avatar, or holographic functionality where present.

These are discovery targets, not confirmation that every module is fully implemented.

Do not introduce a new module simply because it appears in this list.

2.2 Required feature documentation

For every discovered feature, document:

- Feature name and intended outcome.
- User roles and permissions.
- Prerequisites and dependencies.
- UI entry point and complete interaction flow.
- Fields, controls, validation, and default values.
- Android components and relevant dependencies.
- API routes and request/response formats, where applicable.
- Backend services and execution logic.
- Data storage and persistence behaviour.
- Related agents, tools, models, and integrations.
- Device requirements and compatibility.
- Loading, empty, disabled, offline, and error states.
- Likely failures and recovery procedures.
- Security and privacy considerations.
- Test coverage and verification evidence.
- Known shortcomings and incomplete behaviour.
- What SmartView-ai can explain, inspect, configure, or execute.

SmartView-ai must distinguish documented features from implemented features, prototypes, mocks, unavailable services, and unverified behaviour.

2.3 Measurement integrity

SmartView-ai must understand the difference between actual measurements and estimates.

Where supported by the existing application, retain the following provenance classifications:

- "MEASURED"
- "INFERRED"
- "ESTIMATED"
- "USER_CONFIRMED"
- "AI_SUGGESTED"

The Copilot must never present an estimate or AI suggestion as a verified physical measurement.

It must explain uncertainty, identify the source of a value, and request user confirmation when necessary.

---

3. Repository reconnaissance

Before development, the implementation agent must inspect the existing SmartView Pro Android repository.

Inspect:

- Existing Android project structure.
- Application entry points and navigation.
- Activities, fragments, screens, and reusable UI components.
- Existing Copilot implementation and interaction flow.
- CameraX or other camera implementation, where present.
- Camera permissions and lifecycle handling.
- HUD overlays, pointers, guides, and measurement displays.
- Android dependencies and build configuration.
- Gradle files, plugins, and version catalogues.
- Android manifest and permission declarations.
- Device capability detection and compatibility handling.
- API handlers, network clients, and service boundaries.
- Data schemas, Room database entities, migrations, and persistence.
- Project, survey, and measurement relationships.
- Agent, task, and workflow execution.
- Skills, tools, plugins, and MCP integrations, where supported.
- Model providers and gateway adapters.
- Shared knowledge-base implementation.
- Chat streaming and conversation persistence.
- Settings and permissions.
- Existing tests and GitHub Actions workflows.
- APK build and release procedures.
- Environment configuration and deployment.
- Mock data, placeholder screens, TODOs, and demonstration-only logic.

3.1 Preservation of the existing application

The implementation agent must not:

- Replace the existing SmartView Pro application.
- Recreate the existing Copilot as a separate application.
- Replace the existing camera implementation.
- Remove existing Android dependencies without verified justification.
- Convert the Android project into React or a web application.
- Remove working demonstration flows.
- Change existing navigation without a documented requirement.
- Introduce duplicate services where suitable services already exist.
- Remove existing features to accommodate Copilot enhancements.

All changes must be additive, modular, and compatible with the existing project.

3.2 Camera and HUD preservation

The camera is a core SmartView Pro capability and must remain intact.

SmartView-ai may explain, assist with, or operate camera-related functions only through existing, authorized application services.

The agent must inspect the existing implementation of:

- Camera preview and capture.
- Image clarity and image-processing configuration.
- Camera lifecycle and permission handling.
- HUD screen pointers and directional guides.
- Overlay positioning and screen alignment.
- Measurement guidance.
- Orientation and compass information.
- Supported sensor integration.
- Device-specific camera capabilities.
- Performance and fallback behaviour.

Any camera enhancement must preserve existing working behaviour.

Do not introduce new camera controls that are not connected to real application functionality.

3.3 Deferred capabilities

The following capabilities are not part of the current enhancement scope unless explicitly authorized by a later instruction:

- 3D Studio recreation or expansion.
- Image-to-3D generation.
- Video-to-3D generation.
- New 3D modelling workflows.

Do not reintroduce deferred features merely because they appear in older specifications or source code.

3.4 Hologram and voice asset discovery

Inspect the repository for existing hologram, avatar, voice, and media assets only where relevant to the existing Copilot or an explicitly intended enhancement.

If such assets exist, record:

- File name and relative path.
- Media type, dimensions, and aspect ratio.
- Duration, frame rate, and codec for videos.
- Transparency or alpha-channel support.
- File size and mobile suitability.
- Corruption or decoding problems.
- Whether the asset is suitable for idle animation, a talking-head pipeline, or a decorative overlay.

Generate an asset catalogue and, where practical, a contact sheet for review.

Do not invent folder paths. Do not overwrite original media. Store generated assets separately and maintain a clear relationship between source assets and derived outputs.

Do not introduce a holographic avatar or new visual identity if the existing Copilot does not require one.

---

4. Shared knowledge architecture

SmartView-ai must use the application's existing shared knowledge base rather than introduce a competing knowledge system without justification.

4.1 Knowledge sources

The knowledge layer should combine, where available and authorized:

- Product and architecture documentation.
- "SYSTEM_REQUIERMENTS_SPECIFICATION.md".
- "PROJECT_OVERVIEW.md".
- Feature and interaction guides.
- Repository-derived code and API documentation.
- Camera and HUD documentation.
- Device compatibility references.
- Measurement and survey documentation.
- Configuration references.
- Operational runbooks.
- Troubleshooting guides.
- Model-provider documentation.
- Tool, skill, and MCP manifests.
- Current application state.
- Execution results and audit records.
- Version and release history.

Each source should retain provenance, version, update time, and access restrictions.

4.2 Retrieval and answer generation

For each request, the Copilot should:

1. Identify the user's intent.
2. Determine the relevant application module.
3. Retrieve authorized documentation and context.
4. Inspect live application state when necessary and supported.
5. Reconcile conflicting information.
6. Answer with references to the evidence used.
7. Identify uncertainty and known limitations.
8. Offer the appropriate next action.
9. Execute only when authorized and, where required, approved.
10. Verify the result and report what actually happened.

The system must not expose information from other users, restricted projects, private credentials, or unauthorized sources.

4.3 Recommended documentation structure

The agent should create or update an appropriate documentation structure based on the repository's conventions.

Recommended documents include:

- "docs/copilot/product-overview.md"
- "docs/copilot/module-catalog.md"
- "docs/copilot/feature-reference.md"
- "docs/copilot/interaction-flows.md"
- "docs/copilot/android-integration.md"
- "docs/copilot/camera-and-hud.md"
- "docs/copilot/device-compatibility.md"
- "docs/copilot/api-reference.md"
- "docs/copilot/model-provider-guide.md"
- "docs/copilot/tools-and-mcp.md"
- "docs/copilot/permissions-and-governance.md"
- "docs/copilot/troubleshooting.md"
- "docs/copilot/known-limitations.md"
- "docs/copilot/operations-runbook.md"
- "docs/copilot/voice-and-media.md"
- "docs/copilot/glossary.md"
- "docs/copilot/change-history.md"

These are proposed paths. The agent must follow the repository's actual documentation conventions and avoid unnecessary duplicate files.

---

5. Copilot interface and interaction design

SmartView-ai must retain and enhance the existing Copilot interface.

The implementation must use the existing Android framework, component system, and design conventions. Verify the actual technology and UI structure before introducing dependencies.

Do not replace the existing Copilot screen or create a disconnected second interface.

5.1 Interface capabilities

Inspect the existing interface and support the following where appropriate and technically available:

- Clear SmartView-ai identity and availability.
- Existing conversation history.
- Conversation search where supported.
- Streaming assistant responses.
- Visible tool execution and progress.
- Source citations and knowledge references.
- Responsive message composer.
- Send, stop, retry, and attachment controls as supported.
- Voice input and output where supported.
- Model selection and provider status where supported.
- Approval prompts for proposed actions.
- Clear success, warning, and error messages.
- Context indicators for the active project, survey, or application module.
- Accessible settings and display preferences.

5.2 Advanced interaction components

Use suitable components where they fit the existing Android UI:

- Accessible dialogs and bottom sheets.
- Provider status cards.
- Tool and integration status cards.
- Action-preview and approval cards.
- Execution timelines.
- Safe Markdown rendering.
- Tables and knowledge references.
- Loading and empty states.
- Recoverable error panels.
- Existing avatar or holographic elements, where implemented.
- Consistent icons and established design components.

All controls must have meaningful behaviour. Do not introduce decorative controls that appear functional but do nothing.

5.3 Android responsiveness

The interface must adapt to supported Android screen sizes and device capabilities.

Prioritize:

- Small-screen usability.
- Conversation and composer visibility.
- Keyboard visibility and screen resizing.
- Android safe areas and system navigation.
- Touch-target accessibility.
- Orientation changes.
- Battery and memory efficiency.
- Reduced-motion preferences where applicable.

Animation must be purposeful and must not introduce unnecessary GPU or battery consumption.

Any model-generated content must be rendered safely. Never execute arbitrary HTML, scripts, or untrusted content supplied by a model.

5.4 Conversation lifecycle

The intended interaction flow is:

1. User submits a request.
2. The application assigns a conversation and request identifier.
3. SmartView-ai determines intent and relevant application context.
4. It retrieves knowledge or live application state.
5. It streams an answer or action proposal.
6. Required permissions and approvals are checked.
7. Authorized actions execute through real application services.
8. The application verifies the outcome.
9. An audit record is created where appropriate.
10. The interface displays the verified result, including partial failure where relevant.

Cancellation, retries, timeouts, interrupted streams, and application lifecycle changes must be handled explicitly.

---

6. Tools, skills, MCP, and application settings

SmartView-ai must be able to discover and use registered, available, compatible, and authorized tools, skills, and MCP connections.

This is not permission to bypass application security, execute arbitrary code without controls, or gain access to services that SmartView Pro does not support.

6.1 Tool registry

Each available tool should expose metadata describing:

- Stable identifier and version.
- Purpose and documentation.
- Input and output schemas.
- Required permissions.
- Execution environment.
- Dependencies and availability.
- Timeout and retry policy.
- Resource limits.
- Health status.
- Audit requirements.

The Copilot must inspect the tool's schema before calling it, validate inputs, enforce permissions, handle untrusted output, and report failures accurately.

6.2 Application operation support

Where real application services exist, SmartView-ai should be able to assist with operations such as:

- Explaining application features.
- Navigating supported workflows.
- Retrieving project and survey information.
- Inspecting measurement records.
- Explaining measurement provenance.
- Checking supported device capabilities.
- Assisting with camera configuration.
- Explaining camera and HUD status.
- Retrieving quotation or report information.
- Checking supported background task status.
- Explaining application errors.
- Configuring authorized settings.

These operations must use the application's real services and permissions.

The Copilot must not claim to have captured an image, changed a camera setting, measured a building, generated a quotation, or executed an agent task unless the application confirms that the operation occurred.

6.3 Skills adoption

Where a skill system exists, the Copilot should be able to:

1. Search available skills.
2. Inspect documentation and manifests.
3. Check dependencies and compatibility.
4. Review requested permissions.
5. Check licensing and trust where applicable.
6. Request approval when installation or expanded permissions require it.
7. Install through the supported application mechanism.
8. Verify installation and health.
9. Assign or invoke the skill within authorized workflows.
10. Record the resulting state.

A skill must not silently expand the Copilot's permissions.

6.4 MCP management

Where MCP is supported, provide management of:

- Connection endpoint and transport.
- Authentication configuration.
- Advertised tools and resources.
- Connection health.
- Access policies.
- User or workspace assignments.
- Enablement and disablement.
- Error diagnostics and audit history.

Apply protections against server-side request forgery, unauthorized private-network access, malicious tool descriptions, and credential leakage.

Store secrets in an appropriate secure store.

Only connect to endpoints and use capabilities permitted by the application's policies.

Do not introduce an MCP client or connection manager if the existing application does not support it without first documenting the required change and obtaining authorization.

6.5 Application settings management

SmartView-ai should be able to inspect and modify supported settings through authoritative application services.

Potential settings include:

- Supported camera preferences.
- HUD and display preferences.
- Device performance settings.
- Model providers and model assignments.
- Tool and agent enablement.
- MCP connections.
- Voice preferences.
- Notifications.
- Resource limits and budgets.
- Permissions and governance controls.
- Supported storage and backup options.
- Subscription and licensing preferences.

Before changing settings, the Copilot must:

1. Show the intended change.
2. Validate the proposed value.
3. Request approval when required.
4. Apply the change through the real settings service.
5. Verify the saved state.
6. Report any restart or reconnection requirement.

It must not claim a setting has changed until the application confirms success.

---

7. LLM provider configuration and assistance

SmartView-ai must guide users through configuring supported LLM providers, explain configuration errors, and help test model connectivity.

It must first inspect the application's actual model gateway and provider adapters.

External provider support does not automatically mean SmartView Pro has implemented that provider.

7.1 Configuration concepts

Explain these fields in plain language:

- Provider: The service hosting or serving the model.
- Base URL: The endpoint used by the application's adapter.
- API credential: The secret authorizing requests.
- Model ID: The exact model identifier recognized by the provider.
- Protocol: The API format expected by the adapter.
- Capabilities: Text, vision, tool calling, streaming, or other supported functions.
- Routing: Which model receives a particular task.
- Fallback: Which alternative may be used when the primary model fails.

The Copilot must not assume that all providers implement identical APIs.

7.2 Application endpoints

The agent must inspect the repository to identify actual model-configuration endpoints and services.

The following are specification-level examples to verify, not guaranteed existing routes:

Potential route| Intended purpose
"/api/models/providers"| List or manage configured providers
"/api/models"| Discover or list available models
"/api/settings"| Read or update supported settings
"/api/security-audit"| Inspect or record relevant security events

For each real endpoint, document its HTTP method, authentication, authorization, request schema, response schema, validation, errors, and tests.

Do not implement a new route merely because it appears in this table if the existing architecture provides a more appropriate service.

7.3 Provider documentation and example base URLs

The Copilot should refer users to official provider documentation and distinguish provider endpoints from the application's own API.

Examples to validate against the selected provider and adapter:

Provider or runtime| Common base URL or endpoint pattern
OpenAI| "https://api.openai.com/v1"
Anthropic| "https://api.anthropic.com"
Google Gemini| "https://generativelanguage.googleapis.com/v1beta"
OpenRouter| "https://openrouter.ai/api/v1"
Ollama| "http://localhost:11434"
LM Studio| Often "http://localhost:1234/v1"
vLLM| Operator-configured server, commonly exposing "/v1"
llama.cpp server| Operator-configured server, commonly exposing an OpenAI-compatible "/v1" API
Azure OpenAI| Resource-specific endpoint and deployment configuration
AWS Bedrock| Region-specific endpoint and authentication configuration
Google Vertex AI| Project- and region-specific configuration

Localhost URLs refer to the machine where the client or service runs. An Android phone cannot automatically access a model running on another computer through that computer's "localhost" address.

The Copilot must explain this distinction and help the user configure a reachable endpoint securely.

7.4 Recommended provider setup flow

1. Determine which provider the user wants to configure.
2. Check whether the application has a compatible adapter.
3. Obtain the official provider endpoint and model identifier.
4. Explain credential requirements.
5. Direct the user to the secure settings interface.
6. Store credentials in the designated secure store.
7. Discover models if the provider supports discovery.
8. Validate model capabilities.
9. Select the primary model and permitted fallback.
10. Test connectivity.
11. Save and verify the configuration.
12. Explain any remaining errors.

Users should not paste API keys into ordinary chat messages.

7.5 Common configuration errors

Error| Likely cause| Recovery
HTTP 401| Missing or invalid credentials| Re-enter credentials securely
HTTP 403| Access or account permission denied| Check provider permissions
HTTP 404| Incorrect endpoint or model ID| Verify endpoint and model identifier
HTTP 429| Rate limit or quota reached| Check quotas and retry policy
Timeout| Network, provider, or server delay| Test connectivity and timeout configuration
Invalid request| Incorrect payload or API protocol| Verify adapter and provider format
Tool calling unavailable| Model or adapter lacks the capability| Select a compatible model
Context limit exceeded| Prompt exceeds model limits| Reduce context or select a suitable model
TLS or certificate failure| HTTPS configuration problem| Verify certificates and endpoint
Local endpoint unreachable| Service not reachable from the application| Check binding, network, firewall, and deployment
Budget exceeded| Application or provider spending limit| Review authorized budget settings

7.6 Credential and fallback security

Never expose credentials in:

- Chat messages.
- Prompts sent to unrelated models.
- Android logs.
- Application logs.
- URLs or query parameters.
- Screenshots, diagnostics, or error reports.
- Insecure local storage.

Fallback routing must follow explicit privacy rules.

A local-only request must not silently move to a cloud provider. If a fallback changes data-processing location or privacy characteristics, the application must apply the relevant policy and obtain any required approval.

7.7 External documentation

Use official documentation for current provider requirements:

- OpenAI: https://platform.openai.com/docs/api-reference
- Anthropic: https://docs.anthropic.com/
- Google AI: https://ai.google.dev/api
- Ollama: https://docs.ollama.com/
- OpenRouter: https://openrouter.ai/docs
- Azure OpenAI: https://learn.microsoft.com/azure/ai-services/openai/
- AWS Bedrock: https://docs.aws.amazon.com/bedrock/
- Vertex AI: https://cloud.google.com/vertex-ai/generative-ai/docs
- LM Studio: https://lmstudio.ai/docs
- vLLM: https://docs.vllm.ai/
- llama.cpp: https://github.com/ggml-org/llama.cpp

The Copilot must use documentation appropriate to the provider's current API and the actual adapter implemented by SmartView Pro.

---

8. Camera, HUD, and device-aware assistance

SmartView-ai must understand the existing camera and HUD systems and assist users through their actual capabilities.

This section does not authorize replacement or recreation of the camera.

8.1 Camera assistance

Where supported by the existing implementation, SmartView-ai should be able to:

- Explain camera controls.
- Explain camera permissions.
- Identify camera availability and errors.
- Guide users through supported capture workflows.
- Explain image quality and capture limitations.
- Inspect available camera status.
- Assist with supported camera settings.
- Explain the difference between a captured image and a processed result.

Camera operations must remain under the control of the existing camera implementation.

8.2 HUD assistance

Where supported, SmartView-ai should understand:

- HUD indicators.
- Screen pointers and directional guides.
- Overlay alignment.
- Orientation information.
- Measurement guidance.
- Visual warnings.
- Supported sensor information.

It may explain what an indicator means and assist with supported configuration.

It must not fabricate a pointer position, sensor reading, orientation, or measurement.

8.3 Device capability awareness

SmartView-ai must use actual device capability information when determining which features are available.

The Copilot should distinguish:

- Supported hardware capabilities.
- Unsupported hardware capabilities.
- Permission restrictions.
- Android version restrictions.
- Performance limitations.
- Temporary service failures.
- Network-dependent capabilities.

High-spec devices may support more advanced functions where the existing application provides them.

Lower-spec devices must receive appropriate fallbacks rather than misleading controls or failed operations.

Do not claim AR Meter support, advanced sensor support, or physical measurement accuracy on a device that does not provide the required capability.

8.4 Adaptive operation

When a requested feature is unavailable:

1. Identify the reason.
2. Explain the limitation in plain language.
3. Check whether a supported alternative exists.
4. Offer the alternative.
5. Preserve the user's existing project and survey data.
6. Record the limitation where appropriate.

---

9. Project, survey, measurement, and quotation assistance

SmartView-ai should understand the application's project and survey workflows and assist users through the actual implemented operations.

9.1 Project and survey context

Where the existing application supports these records, the Copilot should be able to:

- Identify the active project.
- Retrieve authorized project information.
- Identify the active survey.
- Explain survey status.
- Navigate supported project and survey operations.
- Identify missing information.
- Explain relationships between project, survey, and measurement records.

Preserve the existing data hierarchy:

Project → Survey → Measurement

Do not introduce a competing data structure.

9.2 Measurement assistance

SmartView-ai should:

- Explain measurement records.
- Identify measurement provenance.
- Explain uncertainty and limitations.
- Distinguish user-confirmed values from AI suggestions.
- Identify missing or inconsistent measurement information.
- Assist with supported measurement corrections.
- Require confirmation before changing verified records.

Do not silently alter measurement records.

9.3 Material and quantity assistance

Where implemented, the Copilot may help users understand:

- Surface information.
- Material quantities.
- Calculation assumptions.
- Coverage rates.
- Wastage allowances.
- Product selections.
- Estimation limitations.

All calculations must use actual application logic or documented formulas.

If a value is estimated, label it as an estimate.

9.4 Quotation and reporting assistance

Where supported, SmartView-ai may:

- Explain quotation components.
- Retrieve existing quotation information.
- Identify missing quotation inputs.
- Assist with supported quotation preparation.
- Explain material and labour assumptions.
- Summarize survey findings.
- Retrieve or prepare supported reports.
- Explain export and sharing options.

Externally sharing or issuing a quotation must require the appropriate user approval.

---

10. Voice, avatar, and media interaction

SmartView-ai may support voice and visual interaction where the existing application and its services provide those capabilities.

This section does not require the creation of a new avatar, hologram, or voice engine.

10.1 Voice capabilities

Inspect existing speech recognition and text-to-speech functionality.

Where supported, the Copilot should provide:

- Voice input.
- Spoken responses.
- Clear microphone permission handling.
- Listening and processing indicators.
- Audio playback controls.
- Error and retry handling.
- Appropriate behaviour when offline or when a voice service is unavailable.

The user must be able to understand when the application is listening, processing, or playing audio.

10.2 Avatar and holographic presentation

If the existing Copilot includes an avatar or holographic presentation, preserve it.

Inspect the actual assets and rendering pipeline before making changes.

Any enhancement must:

- Preserve existing Copilot functionality.
- Respect Android performance constraints.
- Avoid unnecessary battery consumption.
- Provide a usable fallback if media rendering fails.
- Avoid blocking the conversation interface.
- Avoid replacing functional controls with decorative animation.

10.3 Media security

Validate imported and generated media.

Do not execute scripts or arbitrary embedded content from media files.

Do not overwrite original assets without explicit authorization.

---

11. Permissions, privacy, and action governance

SmartView-ai must operate within the permissions and security model of SmartView Pro.

11.1 Permission-aware operation

Before accessing data or performing an operation, the Copilot must establish:

- Whether the user is authorized.
- Whether the relevant Android permission is granted.
- Whether the application service permits the operation.
- Whether the operation requires confirmation.
- Whether the operation can be safely reversed.

The Copilot must not bypass Android permission controls or application-level authorization.

11.2 Confirmation requirements

Require explicit confirmation for:

- Deleting project or survey records.
- Overwriting important data.
- Changing security or permission settings.
- Sending information externally.
- Issuing or sharing quotations.
- Installing tools or skills with expanded permissions.
- Changing provider credentials or routing.
- Other sensitive, destructive, externally visible, or irreversible actions.

Explain the proposed action before execution.

11.3 Auditability

Where the application supports audit records, record:

- User or authorized actor.
- Requested operation.
- Target application resource.
- Permission and approval status.
- Execution time.
- Result.
- Error details where appropriate.
- Recovery or rollback information where available.

Do not record passwords, API keys, or other secrets.

11.4 Privacy

SmartView-ai must:

- Respect user and project access restrictions.
- Avoid exposing unrelated user data.
- Avoid sending private project information to unapproved services.
- Respect local-only and provider-routing policies.
- Minimize the information shared with external models.
- Explain when a requested operation requires an external service.

---

12. Subscription, trial, and premium access

The implementation agent must inspect the existing subscription, trial, and premium licensing requirements and implementation.

These commercial capabilities must not be assumed to exist merely because they are specified here.

Where implemented or explicitly required by the existing project specification, SmartView-ai should understand:

- Current subscription status.
- Trial status and applicable limitations.
- Premium feature access.
- Account or licence validation.
- Access restrictions.
- Renewal or expiry information.
- Supported upgrade and management workflows.

The Copilot must not bypass licensing restrictions or unlock premium functionality without authorization.

If licensing services are unavailable, explain the actual state and follow the application's established fallback policy.

Do not invent payment providers, billing endpoints, pricing, or subscription tiers.

---

13. Failure handling and recovery

SmartView-ai must provide useful assistance when application operations fail.

Potential failure categories include:

- Camera unavailable.
- Camera permission denied.
- Unsupported device capability.
- Sensor unavailable.
- Storage unavailable.
- Database or migration error.
- Network interruption.
- Provider authentication failure.
- Model unavailable.
- Tool execution failure.
- MCP connection failure.
- Agent execution failure.
- Media processing failure.
- Voice service failure.
- Subscription validation failure.

For each failure, the Copilot should:

1. Identify the failed operation.
2. Retrieve the actual error where available.
3. Explain the likely cause without presenting guesses as facts.
4. Check for a safe recovery procedure.
5. Offer an authorized recovery action.
6. Verify whether recovery succeeded.
7. Preserve existing user data.
8. Record unresolved limitations where appropriate.

Do not repeatedly retry operations that may create duplicate records or external side effects.

---

14. Testing and verification

Every SmartView-ai enhancement must be tested against the actual Android application.

14.1 Required testing areas

Where applicable, test:

- Existing Copilot functionality.
- Conversation persistence.
- Streaming and interruption handling.
- Context retrieval.
- Knowledge references.
- Permission enforcement.
- Tool execution.
- Settings changes.
- Camera integration.
- HUD preservation.
- Device capability detection.
- Project and survey data access.
- Measurement provenance.
- Offline behaviour.
- Network failure handling.
- Model-provider configuration.
- Credential protection.
- Voice and media handling.
- Subscription and licence checks.
- Android lifecycle behaviour.
- Low-spec device fallback.
- Existing demonstration workflows.

14.2 Regression protection

Before accepting any enhancement, verify that the existing application still performs its established functions.

A Copilot enhancement must not introduce regressions in:

- Application launch.
- Navigation.
- Camera preview.
- Camera capture.
- HUD rendering.
- Existing survey operations.
- Existing measurement operations.
- Existing data persistence.
- Existing Copilot conversations.
- Existing build and APK generation.

14.3 Evidence requirements

For each completed task, provide:

- Task identifier.
- Objective.
- Files changed.
- Existing functionality preserved.
- Implementation summary.
- Build result.
- Tests performed.
- Verification evidence.
- Known limitations.
- Final status: PASS or FAIL.

A task with incomplete verification must remain incomplete.

---

15. Implementation sequence and change control

The implementation agent must work incrementally.

15.1 Initial stage — Repository and capability audit

1. Inspect the existing repository.
2. Read the named project specifications.
3. Inspect the existing Copilot.
4. Map the actual SmartView Pro modules.
5. Identify existing services and integrations.
6. Record implementation status.
7. Identify missing or conflicting documentation.
8. Produce a concise audit report.
9. Do not begin unrelated redesign or replacement work.

15.2 Enhancement stage — Additive integration

After the audit:

1. Identify the smallest suitable enhancement.
2. Reuse existing application services.
3. Preserve the existing Copilot interface.
4. Implement one capability at a time.
5. Maintain modular boundaries.
6. Test the change.
7. Verify existing functionality.
8. Record evidence.
9. Mark PASS only when verified.

15.3 Documentation lifecycle

Maintain the existing project documentation.

Update the project overview and relevant Copilot documentation as development progresses.

Record:

- What was already present.
- What was enhanced.
- What was newly added.
- What remains incomplete.
- What was deferred.
- What was tested and verified.

Do not create duplicate documentation merely to satisfy this specification.

15.4 Change control

Before making a change that could affect existing application behaviour:

1. Identify the affected component.
2. Explain the reason for the change.
3. Identify dependencies.
4. Identify possible regressions.
5. Define the verification method.
6. Preserve a recoverable state where possible.

Do not silently remove or replace existing functionality.

---

16. Final acceptance criteria

SmartView-ai enhancement is acceptable only when the implementation agent can demonstrate that:

1. The existing SmartView Pro Android application remains intact.
2. The existing Copilot has been enhanced rather than recreated.
3. The actual application modules have been inspected and documented.
4. Documentation and implementation discrepancies have been recorded.
5. SmartView-ai can explain supported application functionality accurately.
6. It distinguishes real application state from assumptions.
7. It uses existing services and integrations where appropriate.
8. It respects user permissions and Android permissions.
9. Sensitive operations require appropriate confirmation.
10. Tool and model failures are handled clearly.
11. Camera and HUD functionality remain intact.
12. Device capability limitations are accurately represented.
13. Measurement provenance is preserved.
14. Existing project and survey data remain protected.
15. Existing application workflows continue to work.
16. All completed tasks have build, test, and verification evidence.
17. Known limitations and deferred capabilities are documented.

Final governing rule: SmartView-ai must make SmartView Pro more intelligent, easier to operate, easier to understand, and more capable without compromising or replacing the application that already exists.

Enhance the existing system. Preserve what works. Verify every new capability.

17. Continuous Application Awareness and Feature Synchronisation

17.1 Governing requirement

SmartView-ai must maintain an up-to-date understanding of the entire SmartView Pro application throughout its development lifecycle.

The Copilot must never remain limited to the features that existed when it was first implemented.

Whenever a new feature is added, an existing feature is modified, an integration is connected, a workflow changes, or an application capability is removed or deferred, SmartView-ai's knowledge and capability documentation must be updated accordingly.

The application and its Copilot must evolve together.

17.2 Mandatory feature-update workflow

Every development task that changes application functionality must include a Copilot awareness update.

Required sequence:

Feature Development → Build → Test → Verify → Documentation Update → Copilot Knowledge Synchronisation → Awareness Test → Evidence → PASS

A feature cannot be considered fully completed until the Copilot's relevant knowledge has been updated and verified.

17.3 Automatic change awareness

The implementation agent must establish a reliable process for detecting application changes through the existing development workflow.

Inspect and use appropriate existing mechanisms, such as:

- Git commits and change history.
- Pull requests and merged changes.
- Application module documentation.
- Feature specifications.
- API and service changes.
- Database schema and migration changes.
- New dependencies and integrations.
- UI and navigation changes.
- Agent, tool, and workflow changes.
- Configuration and permission changes.
- Release and version records.

Where technically supported, connect these change events to the Copilot's documentation and knowledge-update process.

Do not assume that a Git commit alone provides sufficient information about a feature's behaviour.

17.4 Continuous feature registry

Maintain a central, version-controlled feature registry that records every application capability.

Each feature record should include:

- Feature identifier.
- Feature name.
- Description and intended purpose.
- Application module.
- Current implementation status.
- User interaction and entry point.
- Related UI components.
- Relevant services and APIs.
- Data dependencies.
- Required permissions.
- Device and hardware requirements.
- Related tools, agents, and integrations.
- Configuration options.
- Known limitations.
- Testing and verification evidence.
- Documentation references.
- Version introduced or last modified.

The registry must distinguish between:

- Planned.
- In development.
- Implemented but unverified.
- Verified and operational.
- Partially available.
- Temporarily unavailable.
- Deprecated.
- Removed.

17.5 Copilot knowledge synchronisation

After every verified feature change, SmartView-ai must receive the relevant updated information through the application's established knowledge infrastructure.

Synchronisation must cover, where relevant:

1. Feature descriptions and instructions.
2. Updated user workflows.
3. Navigation and UI changes.
4. New settings and configuration options.
5. New APIs and application services.
6. New tools and agent capabilities.
7. Updated data structures.
8. Permission changes.
9. Device compatibility changes.
10. Error handling and troubleshooting.
11. Known limitations.
12. Version and release information.

The Copilot must be able to identify when its knowledge is outdated and avoid presenting obsolete instructions as current functionality.

17.6 Feature awareness verification

Following every synchronisation, test SmartView-ai against the updated feature.

The awareness test must establish that the Copilot can:

- Identify the new or modified feature.
- Explain its purpose accurately.
- Identify where the user accesses it.
- Explain how it works.
- Identify prerequisites and permissions.
- Recognise its current implementation status.
- Explain relevant limitations.
- Retrieve the correct documentation.
- Identify related application functionality.
- Guide the user through supported operations.

Where execution is supported, verify that the Copilot can invoke the appropriate authorized application service.

A feature must not be marked Copilot-aware merely because its name appears in a document.

17.7 Version and knowledge consistency

The feature registry, documentation, and Copilot knowledge must retain version information.

SmartView-ai should be able to answer questions such as:

- What features are currently available?
- What was added in the latest release?
- What has changed since the previous version?
- Which features are still incomplete?
- Which capabilities are unavailable on this device?
- Which features require a subscription or permission?
- What has been deprecated or removed?

When documentation, repository code, and runtime behaviour disagree, the Copilot must identify the discrepancy and avoid claiming certainty.

17.8 Development completion gate

Every development completion report must include a section titled:

SmartView-ai Awareness Update

It must state:

- Features added or modified.
- Documentation updated.
- Feature registry updated.
- Knowledge synchronisation result.
- Awareness tests performed.
- Verified Copilot understanding.
- Remaining knowledge gaps.

If synchronisation or awareness testing fails, report the issue and do not claim full completion.

17.9 Long-term objective

SmartView-ai must become the application's continuously maintained operational intelligence layer.

As SmartView Pro grows, the Copilot should progressively understand more of its functionality without requiring the entire Copilot to be rebuilt or manually reconfigured after every development cycle.

The implementation must remain modular, maintainable, secure, and compatible with the existing application.

Final rule: No feature is fully complete until SmartView Pro works, its documentation is current, and SmartView-ai understands the feature accurately.