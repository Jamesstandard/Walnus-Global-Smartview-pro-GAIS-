import fs from 'fs';
let content = fs.readFileSync('src/components/EstimatorApp.tsx', 'utf8');

// Remove the first Neural3DGenerator entirely
const firstNeuralStr = `{(!minimizedPanels?.has('photogrammetric_overlay') || workflowStage === 'MODEL_VIEWER' || isNeural3DFullscreenOpen) && (
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
                onClose={() => {
                   setIsNeural3DFullscreenOpen(false);
                   onMinimizePanel?.('photogrammetric_overlay');
                }}
              />
            )}`;
content = content.replace(firstNeuralStr, '');

// Move the second Neural3DGenerator out of MODEL_VIEWER and update its onClose
const secondNeuralRegex = /\{workflowStage === 'MODEL_VIEWER' && \([\s\S]*?<Neural3DGenerator[\s\S]*?\/>\s*\)\}/;
content = content.replace(secondNeuralRegex, '');

// Insert it into the relative z-10 space-y-4 container
const mergedNeural3D = `{(!minimizedPanels?.has('photogrammetric_overlay') || workflowStage === 'MODEL_VIEWER' || isNeural3DFullscreenOpen) && (
              <Neural3DGenerator
                projectName={projectName}
                colorHex={colorHex}
                paintType={paintType}
                surfaceArea={surfaceArea}
                siteParams={siteParams}
                initialSource={reconstructSource}
                initialEngine={reconstructEngine}
                isStandaloneFullScreen={false}
                onClose={() => {
                   setIsNeural3DFullscreenOpen(false);
                   setWorkflowStage('MARKET_INTELLIGENCE');
                   onMinimizePanel?.('photogrammetric_overlay');
                }}
                onUpdateMeasurements={(sqMeters, sqFt) => {
                  handleUpdateSiteParams({ siteAreaSqMeters: sqMeters });
                  setSurfaceArea(sqFt);
                  setModelGenerated(true);
                }}
                onPackageAndSync={handlePackageAndSync}
                onOpenWorkspace={onOpenWorkspace}
              />
            )}`;

content = content.replace(
  `{/* Surface Content (Sitting on top of the Immersive Canvas) */}`,
  `{/* Surface Content (Sitting on top of the Immersive Canvas) */}
          ${mergedNeural3D}`
);

fs.writeFileSync('src/components/EstimatorApp.tsx', content);
console.log('EstimatorApp patched with merged Neural3DGenerator.');
