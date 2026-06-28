const fs = require('fs');
for (const file of ['src/components/DetailedSelectionProtocolForm.tsx']) {
  let code = fs.readFileSync(file, 'utf-8');
  
  // Wrapper
  code = code.replace(/h-full bg-stone-900 border border-stone-800/g, 'h-full bg-stone-100 border border-stone-200');
  code = code.replace(/bg-stone-950 border-b border-stone-800/g, 'bg-white border-b border-stone-200');
  
  // Header text (we have to be careful with text-white replace, we'll individually do buttons)
  // Let's manually replace
  code = code.replace(/bg-stone-900 border border-stone-800/g, 'hidden sm:flex bg-stone-50 border border-stone-200');
  code = code.replace(/hover:bg-stone-800 text-stone-400 hover:text-stone-200/g, 'hover:bg-white text-stone-600 hover:text-stone-800');
  
  code = code.replace(/bg-stone-900\/50/g, 'bg-white sm:bg-stone-50/80');

  // Let's also do the mobile inputs flex layout "từng dòng"
  code = code.replace(/<div className="flex items-center gap-1\.5">(\s*<span className="font-bold text-stone-700 whitespace-nowrap">.*?<\/span>\s*<input)/g, '<div className="flex flex-col sm:flex-row sm:items-center items-start gap-1 sm:gap-1.5 w-full">$1');
  
  // Mobile grids
  code = code.replace(/<div className="grid grid-cols-2 gap-4/g, '<div className="grid grid-cols-1 sm:grid-cols-2 gap-4');
  code = code.replace(/<div className="grid grid-cols-2 gap-x-8/g, '<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8');
  
  // flex-1
  code = code.replace(/className="flex-1 /g, 'className="flex-1 w-full sm:w-auto ');

  // Full min height
  code = code.replace(/min-h-\[350mm\]/g, 'min-h-full sm:min-h-[350mm]');

  fs.writeFileSync(file, code);
}
