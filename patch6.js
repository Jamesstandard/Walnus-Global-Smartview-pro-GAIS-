import fs from 'fs';

let content = fs.readFileSync('src/components/EstimatorApp.tsx', 'utf8');

// 1. Move project_mode out
content = content.replace(
  `{workflowStage === 'CONFIGURATION' && (
              <div className="space-y-4">
                {!minimizedPanels?.has('project_mode') && (
                  <ProjectModeHoverSelector
                    currentMode={projectMode}
                    onSelectMode={handleSelectProjectMode}
                    onMinimize={() => onMinimizePanel?.('project_mode')}
                  />
                )}`,
  `{!minimizedPanels?.has('project_mode') && (
              <ProjectModeHoverSelector
                currentMode={projectMode}
                onSelectMode={handleSelectProjectMode}
                onMinimize={() => onMinimizePanel?.('project_mode')}
              />
            )}
            
            {workflowStage === 'CONFIGURATION' && (
              <div className="space-y-4">`
);

// 2. Move ProjectDesignationHoverCard out (paint_spec)
// It doesn't have a check currently.
const pdhcStr = `<ProjectDesignationHoverCard
                  projectName={projectName}
                  onProjectNameChange={setProjectName}
                  paintType={paintType}
                  onPaintTypeChange={setPaintType}
                  colorHex={colorHex}
                  onColorHexChange={setColorHex}
                  siteParams={siteParams}
                  onUpdateSiteParams={handleUpdateSiteParams}
                  formulationTarget={formulationTarget}
                  projectMode={projectMode}
                  onMinimize={() => onMinimizePanel?.('paint_spec')}
                />`;
content = content.replace(pdhcStr, '');
content = content.replace(
  `{/* Surface Content (Sitting on top of the Immersive Canvas) */}
          <div className="relative z-10 space-y-4">`,
  `{/* Surface Content (Sitting on top of the Immersive Canvas) */}
          <div className="relative z-10 space-y-4">
            {!minimizedPanels?.has('paint_spec') && (
              <ProjectDesignationHoverCard
                projectName={projectName}
                onProjectNameChange={setProjectName}
                paintType={paintType}
                onPaintTypeChange={setPaintType}
                colorHex={colorHex}
                onColorHexChange={setColorHex}
                siteParams={siteParams}
                onUpdateSiteParams={handleUpdateSiteParams}
                formulationTarget={formulationTarget}
                projectMode={projectMode}
                onMinimize={() => onMinimizePanel?.('paint_spec')}
              />
            )}`
);

// 3. WeatherCopilotSchedulerPanel (weather)
content = content.replace(
  `{isWeatherPanelOpen && (
                  <WeatherCopilotSchedulerPanel
                    siteParams={siteParams}
                    onUpdateSiteParams={handleUpdateSiteParams}
                    onTargetCalculated={setFormulationTarget}
                    onClose={() => setIsWeatherPanelOpen(false)}
                  />
                )}`,
  ``
);
content = content.replace(
  `{/* Surface Content (Sitting on top of the Immersive Canvas) */}
          <div className="relative z-10 space-y-4">`,
  `{/* Surface Content (Sitting on top of the Immersive Canvas) */}
          <div className="relative z-10 space-y-4">
            {(!minimizedPanels?.has('weather') || isWeatherPanelOpen) && (
              <WeatherCopilotSchedulerPanel
                siteParams={siteParams}
                onUpdateSiteParams={handleUpdateSiteParams}
                onTargetCalculated={setFormulationTarget}
                onClose={() => {
                  setIsWeatherPanelOpen(false);
                  onMinimizePanel?.('weather');
                }}
              />
            )}`
);

// 4. Site Payload Package
const payloadStr = `<div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider font-mono">
                          Site Payload Package
                        </span>
                      </div>
                    </div>
                    <div className="p-3 border border-slate-800/80 rounded bg-black/60 font-mono text-[11px] text-slate-300 leading-tight">
                      <pre className="overflow-x-auto text-[10px] text-slate-400">{\`{
  "project_name": "\${projectName.replace(/\\s+/g, '_')}",
  "paint_type": "\${paintType}",
  "color_hex": "\${colorHex}",
  "surface_area_sqft": \${surfaceArea},
  "volume_gallons": \${(surfaceArea / 350).toFixed(2)},
  "captured_image": "\${capturedPhoto ? '[Embedded Base64 Site Photo]' : 'none'}"
}\`}
                      </pre>
                    </div>
                 </div>`;

content = content.replace(payloadStr, '');
content = content.replace(
  `{/* Surface Content (Sitting on top of the Immersive Canvas) */}
          <div className="relative z-10 space-y-4">`,
  `{/* Surface Content (Sitting on top of the Immersive Canvas) */}
          <div className="relative z-10 space-y-4">
            {!minimizedPanels?.has('site_payload') && (
              ${payloadStr.replace(/\$/g, '$$$')}
            )}`
);

// 5. Neural3DGenerator (photogrammetric_overlay)
const neural3DStr = `{workflowStage === 'MODEL_VIEWER' && (
              <Neural3DGenerator
                projectName={projectName}
                colorHex={colorHex}
                paintType={paintType}
                surfaceArea={surfaceArea}
                siteParams={siteParams}
                reconstructEngine={reconstructEngine}
                onEngineChange={setReconstructEngine}
                reconstructSource={reconstructSource}
                onSourceChange={setReconstructSource}
                capturedPhoto={capturedPhoto}
              />
            )}`;
content = content.replace(neural3DStr, '');
content = content.replace(
  `{/* Surface Content (Sitting on top of the Immersive Canvas) */}
          <div className="relative z-10 space-y-4">`,
  `{/* Surface Content (Sitting on top of the Immersive Canvas) */}
          <div className="relative z-10 space-y-4">
            {(!minimizedPanels?.has('photogrammetric_overlay') || workflowStage === 'MODEL_VIEWER' || isNeural3DFullscreenOpen) && (
              <Neural3DGenerator
                projectName={projectName}
                colorHex={colorHex}
                paintType={paintType}
                surfaceArea={surfaceArea}
                siteParams={siteParams}
                reconstructEngine={reconstructEngine}
                onEngineChange={setReconstructEngine}
                reconstructSource={reconstructSource}
                onSourceChange={setReconstructSource}
                capturedPhoto={capturedPhoto}
                onMinimize={() => {
                   setIsNeural3DFullscreenOpen(false);
                   onMinimizePanel?.('photogrammetric_overlay');
                }}
              />
            )}`
);

fs.writeFileSync('src/components/EstimatorApp.tsx', content);
console.log('EstimatorApp patched.');
