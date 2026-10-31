import fs from 'fs';
let content = fs.readFileSync('src/components/EstimatorApp.tsx', 'utf8');

content = content.replace(
  `onMinimize={() => {
                   setIsNeural3DFullscreenOpen(false);
                   onMinimizePanel?.('photogrammetric_overlay');
                }}`,
  `onClose={() => {
                   setIsNeural3DFullscreenOpen(false);
                   onMinimizePanel?.('photogrammetric_overlay');
                }}`
);

fs.writeFileSync('src/components/EstimatorApp.tsx', content);
console.log('EstimatorApp patched onClose for Neural3D.');
