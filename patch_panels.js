import fs from 'fs';
let content = fs.readFileSync('src/components/FloatingMinimizedPanels.tsx', 'utf8');

// Change container from bottom-14 right-3 flex-col items-end 
// to top-4 left-1/2 -translate-x-1/2 flex-row items-center
content = content.replace(
  `className="fixed bottom-14 right-3 sm:right-4 z-50 flex flex-col gap-2 items-end select-none pointer-events-none font-mono"`,
  `className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-row flex-wrap justify-center gap-2 items-center select-none pointer-events-none font-mono w-full px-4"`
);

// Remove the slide-in translation from the individual buttons
content = content.replace(
  /className="pointer-events-auto group relative flex items-center gap-2 cursor-pointer transition-transform duration-200 translate-x-\[75%\] hover:translate-x-0"/g,
  `className="pointer-events-auto group relative flex items-center gap-2 cursor-pointer transition-transform duration-200 hover:scale-105"`
);

// Change initial animation to slide down from top
content = content.replace(
  /initial=\{\{ opacity: 0, scale: 0.7, x: 50, y: 10 \}\}/g,
  `initial={{ opacity: 0, scale: 0.7, y: -20 }}`
);
content = content.replace(
  /exit=\{\{ opacity: 0, scale: 0.7, x: 80 \}\}/g,
  `exit={{ opacity: 0, scale: 0.7, y: -20 }}`
);

// Fix the hint caption positioning to appear below the button rather than left of it
content = content.replace(
  `className="hidden group-hover:flex flex-col items-end px-2.5 py-1 rounded-xl bg-slate-900/95 border border-slate-700/80 shadow-xl backdrop-blur-md text-right transition-all animate-in fade-in slide-in-from-right-2"`,
  `className="absolute top-full mt-2 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center px-2.5 py-1 rounded-xl bg-slate-900/95 border border-slate-700/80 shadow-xl backdrop-blur-md text-center transition-all animate-in fade-in slide-in-from-top-2 whitespace-nowrap"`
);

fs.writeFileSync('src/components/FloatingMinimizedPanels.tsx', content);
console.log('FloatingMinimizedPanels patched.');
