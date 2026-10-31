import fs from 'fs';
let content = fs.readFileSync('src/components/FloatingMinimizedPanels.tsx', 'utf8');

content = content.replace(
  `className="pointer-events-auto group relative flex items-center gap-2 cursor-pointer transition-transform duration-200 hover:scale-105"`,
  `className="pointer-events-auto group relative flex items-center gap-2 cursor-pointer transition-transform duration-200 translate-x-[75%] hover:translate-x-0 active:translate-x-0 focus:translate-x-0"`
);

fs.writeFileSync('src/components/FloatingMinimizedPanels.tsx', content);
console.log('FloatingMinimizedPanels reverted translate-x-[75%].');
