import fs from 'fs';

let content = fs.readFileSync('src/components/FloatingMinimizedPanels.tsx', 'utf8');

// The issue might be that placing onClick on the motion.div works, but maybe we need to put it on the button directly to ensure it triggers properly in the UI. Or maybe the translate-x is messing with click targets in a way that placing it on the button explicitly fixes it.
// Wait, what if I remove `pointer-events-none` from the container? No, that would block everything behind it.
// `pointer-events-auto` on the motion.div is correct.
// Let's add onClick to the button inside just in case, and change the button to pointer-events-auto.

const findStr = `<button
                type="button"
                className={\`relative flex items-center justify-center gap-2 p-2.5 rounded-2xl bg-gradient-to-tr \${config.bg} border \${config.border} text-white shadow-2xl hover:scale-105 active:scale-95 transition-all group-hover:ring-2 group-hover:ring-white/40\`}
                title={\`\${config.title} (\${config.category}) - Click to restore\`}
              >`;

const replaceStr = `<button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  playClickSound();
                  onRestore(id);
                }}
                className={\`pointer-events-auto relative flex items-center justify-center gap-2 p-2.5 rounded-2xl bg-gradient-to-tr \${config.bg} border \${config.border} text-white shadow-2xl hover:scale-105 active:scale-95 transition-all group-hover:ring-2 group-hover:ring-white/40\`}
                title={\`\${config.title} (\${config.category}) - Click to restore\`}
              >`;

content = content.replace(findStr, replaceStr);

fs.writeFileSync('src/components/FloatingMinimizedPanels.tsx', content);
console.log('FloatingMinimizedPanels.tsx patched for button click.');
