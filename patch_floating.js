import fs from 'fs';

// 1. Update FloatingMinimizedPanels.tsx
let floatingContent = fs.readFileSync('src/components/FloatingMinimizedPanels.tsx', 'utf8');

// The file was partially edited. Let's find the motion.div and replace it correctly.
const startStr = `<motion.div\n              key={id}\n              layout`;
const endStr = `              {/* Hovering Component Button Icon */}`;

const startIndex = floatingContent.indexOf(startStr);
const endIndex = floatingContent.indexOf(endStr, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const newBlock = `<motion.div
              key={id}
              layout
              initial={{ opacity: 0, scale: 0.7, x: 50, y: 10 }}
              animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.7, x: 80 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              className="pointer-events-auto group relative flex items-center gap-2 cursor-pointer transition-transform duration-200 translate-x-[75%] hover:translate-x-0"
            >
              {/* Hint Caption on Hover */}
              <div className="hidden group-hover:flex flex-col items-end px-2.5 py-1 rounded-xl bg-slate-900/95 border border-slate-700/80 shadow-xl backdrop-blur-md text-right transition-all animate-in fade-in slide-in-from-right-2">
                <span className={\`text-xs font-mono font-bold \${config.text}\`}>
                  {config.title}
                </span>
                <span className="text-[9px] text-slate-400">
                  Click to restore
                </span>
              </div>
`;
  floatingContent = floatingContent.slice(0, startIndex) + newBlock + floatingContent.slice(endIndex);
  
  // also we want to make sure the click action opens it (it's already on the button inside)
  fs.writeFileSync('src/components/FloatingMinimizedPanels.tsx', floatingContent);
  console.log('FloatingMinimizedPanels patched.');
} else {
  console.log('Failed to patch FloatingMinimizedPanels');
}

// 2. Remove aspect ratio buttons from CameraViewfinder
let cameraContent = fs.readFileSync('src/components/CameraViewfinder.tsx', 'utf8');
const aspectStart = `{/* Aspect Ratio Switcher Widget Pill */}`;
const aspectEndStr = `</button>\n                </div>`;

const aStartIndex = cameraContent.indexOf(aspectStart);
if (aStartIndex !== -1) {
  const aEndIndex = cameraContent.indexOf(aspectEndStr, aStartIndex);
  if (aEndIndex !== -1) {
    cameraContent = cameraContent.slice(0, aStartIndex) + cameraContent.slice(aEndIndex + aspectEndStr.length);
    fs.writeFileSync('src/components/CameraViewfinder.tsx', cameraContent);
    console.log('CameraViewfinder patched.');
  }
} else {
  console.log('Aspect ratio buttons not found.');
}
