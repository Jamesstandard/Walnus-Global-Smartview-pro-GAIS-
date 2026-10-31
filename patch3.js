import fs from 'fs';

let cameraContent = fs.readFileSync('src/components/CameraViewfinder.tsx', 'utf8');
const startStr = `export const AspectRatioControlBar = React.memo(function AspectRatioControlBar({`;
const endStr = `</button>\n    </div>\n  );\n});\n`;

const startIndex = cameraContent.indexOf(startStr);
if (startIndex !== -1) {
  const endIndex = cameraContent.indexOf(endStr, startIndex) + endStr.length;
  cameraContent = cameraContent.slice(0, startIndex) + cameraContent.slice(endIndex);
  fs.writeFileSync('src/components/CameraViewfinder.tsx', cameraContent);
  console.log('Dead AspectRatioControlBar removed.');
} else {
  console.log('Dead AspectRatioControlBar not found.');
}
