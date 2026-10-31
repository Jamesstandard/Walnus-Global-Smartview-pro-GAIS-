import fs from 'fs';

let floatingContent = fs.readFileSync('src/components/FloatingMinimizedPanels.tsx', 'utf8');

// The file was partially edited. Let's find the motion.div and replace it correctly.
const startStr = `<motion.div
              key={id}
              layout`;
const endStr = `</motion.div>`;

const startIndex = floatingContent.indexOf(startStr);
const endIndex = floatingContent.indexOf(endStr, startIndex) + endStr.length;

if (startIndex !== -1 && endIndex !== -1) {
  const newBlock = `<motion.div
              key={id}
              layout
              initial={{ opacity: 0, scale: 0.7, x: 50, y: 10 }}
              animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.7, x: 80 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              className="pointer-events-auto group relative flex items-center gap-2 cursor-pointer transition-transform duration-200 translate-x-[75%] hover:translate-x-0"
              onClick={() => {
                playClickSound();
                onRestore(id);
              }}
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
              {/* Hovering Component Button Icon */}
              <button
                type="button"
                className={\`relative flex items-center justify-center gap-2 p-2.5 rounded-2xl bg-gradient-to-tr \${config.bg} border \${config.border} text-white shadow-2xl hover:scale-105 active:scale-95 transition-all group-hover:ring-2 group-hover:ring-white/40\`}
                title={\`\${config.title} (\${config.category}) - Click to restore\`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-xs font-mono font-bold tracking-tight hidden sm:inline max-w-[130px] truncate">
                  {config.title}
                </span>
                {/* Dismiss X button */}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    playClickSound();
                    onDismiss(id);
                  }}
                  className="p-0.5 rounded-full bg-black/40 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
                  title="Clear from screen"
                >
                  <X className="w-3 h-3" />
                </span>
              </button>
            </motion.div>`;
  floatingContent = floatingContent.slice(0, startIndex) + newBlock + floatingContent.slice(endIndex);
  
  fs.writeFileSync('src/components/FloatingMinimizedPanels.tsx', floatingContent);
  console.log('FloatingMinimizedPanels patched.');
} else {
  console.log('Failed to patch FloatingMinimizedPanels');
}
