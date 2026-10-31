import fs from 'fs';
let content = fs.readFileSync('src/components/FloatingMinimizedPanels.tsx', 'utf8');

content = content.replace(
  /x: isObstructed \? 160 : 0,/g,
  `y: isObstructed ? -100 : 0,`
);

fs.writeFileSync('src/components/FloatingMinimizedPanels.tsx', content);
console.log('FloatingMinimizedPanels patched animation.');
