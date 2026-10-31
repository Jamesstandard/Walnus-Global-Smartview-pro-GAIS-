import fs from 'fs';
let content = fs.readFileSync('src/components/Neural3DGenerator.tsx', 'utf8');

content = content.replace(
  `interface Neural3DGeneratorProps {`,
  `interface Neural3DGeneratorProps {
  onMinimize?: () => void;`
);

content = content.replace(
  `}: Neural3DGeneratorProps) {`,
  `  onMinimize,
}: Neural3DGeneratorProps) {`
);

// We should also add a minimize button. Where does it have close/minimize buttons?
// Let's search for "Fullscreen" or "Close".
// Let's see if there is any X button.

fs.writeFileSync('src/components/Neural3DGenerator.tsx', content);
console.log('Neural3DGenerator patched.');
