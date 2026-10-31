import fs from 'fs';
let content = fs.readFileSync('src/components/CameraViewfinder.tsx', 'utf8');

// The block starts with {/* Viewfinder Aspect Ratio Scaling Selector */}
const aspectRegex = /\{\/\* Viewfinder Aspect Ratio Scaling Selector \*\/\}[\s\S]*?(?=<\/div>[\s]*\{\/\* Top Status HUD)/;
content = content.replace(aspectRegex, '');

fs.writeFileSync('src/components/CameraViewfinder.tsx', content);
console.log('CameraViewfinder patched to remove aspect ratio buttons.');
