const fs = require('fs');
let code = fs.readFileSync('src/components/DetailedSelectionProtocolForm.tsx', 'utf-8');

// Lịch sử / Update buttons
code = code.replace(
  /className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 hover:border-stone-600 text-stone-300 transition-colors rounded-lg text-xs font-medium"/g,
  'className="flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-600 transition-colors rounded-lg text-xs font-medium"'
);

// Lưu / Xóa buttons
code = code.replace(
  /className="inline-flex items-center gap-1.5 px-3 py-1.5 text-stone-300 bg-stone-900 border border-stone-700 hover:bg-stone-800 rounded-lg text-xs font-medium transition-all"/g,
  'className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-50 hover:bg-stone-100 text-stone-600 hover:text-stone-800 border border-stone-200 rounded-lg text-xs font-medium transition-all"'
);

// Close button
code = code.replace(
  /className="inline-flex items-center justify-center w-8 h-8 text-stone-400 hover:text-white bg-stone-900 hover:bg-red-500\/80 border border-stone-700 hover:border-red-500 rounded-lg transition-all ml-1"/g,
  'className="inline-flex items-center justify-center w-8 h-8 text-stone-400 hover:text-white bg-stone-50 hover:bg-red-500/80 border border-stone-200 hover:border-red-500 rounded-lg transition-all ml-1"'
);

fs.writeFileSync('src/components/DetailedSelectionProtocolForm.tsx', code);
