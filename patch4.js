import fs from 'fs';

let appContent = fs.readFileSync('src/components/EstimatorApp.tsx', 'utf8');

// 1. Change CameraViewfinder rendering to respect isCameraOpen
const searchStr = `{workflowStage === 'CAPTURE' && (
              <div className="space-y-2">
                <CameraViewfinder`;

const replacementStr = `{workflowStage === 'CAPTURE' && (
              <div className="space-y-2">
                {isCameraOpen ? (
                  <CameraViewfinder
                    onCapture={(img) => {
                      setCapturedPhoto(img);
                      setWorkflowStage('ANALYSIS');
                      setIsCameraOpen(false);
                    }}
                    onCancel={() => setIsCameraOpen(false)}
                    initialJobMode={
                      projectMode === 'screed'
                        ? 'screeding'
                        : projectMode === 'plaster'
                        ? 'plastering'
                        : 'painting'
                    }
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950/50 backdrop-blur-sm">
                    <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
                      <Camera className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-sm font-mono text-slate-300 mb-2">Camera Viewfinder Minimized</h3>
                    <p className="text-xs font-mono text-slate-500 mb-6 text-center max-w-xs">
                      The spatial canvas is running in the background. Reactivate the camera to continue site capture.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsCameraOpen(true)}
                      className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold shadow-lg shadow-indigo-900/50 transition-all flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      Open Camera
                    </button>
                  </div>
                )}
              </div>
            )}`;

appContent = appContent.replace(
  `{workflowStage === 'CAPTURE' && (
              <div className="space-y-2">
                <CameraViewfinder
                  onCapture={(img) => {
                    setCapturedPhoto(img);
                    setWorkflowStage('ANALYSIS');
                  }}
                  onCancel={() => {}}
                  initialJobMode={
                    projectMode === 'screed'
                      ? 'screeding'
                      : projectMode === 'plaster'
                      ? 'plastering'
                      : 'painting'
                  }
                />
              </div>
            )}`,
  replacementStr
);

// 2. Default isCameraOpen to true
appContent = appContent.replace(
  `const [isCameraOpen, setIsCameraOpen] = useState(false);`,
  `const [isCameraOpen, setIsCameraOpen] = useState(true);`
);

fs.writeFileSync('src/components/EstimatorApp.tsx', appContent);
console.log('EstimatorApp.tsx patched for Camera X button behavior.');
