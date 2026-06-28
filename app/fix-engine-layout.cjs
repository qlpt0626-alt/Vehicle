const fs = require('fs');
let code = fs.readFileSync('src/components/EngineInspectionBeforeRepairForm.tsx', 'utf-8');

// Also fix the wrapper
code = code.replace(
  /<div className="flex-1 overflow-auto p-2 sm:p-6 pb-20 print:p-0 print:pb-0" style=\{\{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' \}\}>/g,
  '<div className="flex-1 overflow-y-auto overflow-x-hidden p-0 sm:p-6 pb-20 print:p-0 print:block bg-white sm:bg-stone-50/80 custom-scrollbar">'
);
code = code.replace(
  /<div className="flex-1 overflow-auto p-4 sm:p-8 pb-32 pt-8 print:p-0 print:pb-0 relative custom-scrollbar flex sm:justify-center bg-stone-100\/50">/g,
  '<div className="flex-1 overflow-y-auto overflow-x-hidden p-0 sm:p-8 pb-32 pt-0 sm:pt-8 print:p-0 print:block relative custom-scrollbar flex sm:justify-center bg-white sm:bg-stone-100/50">'
);
code = code.replace(
  /className="bg-white shadow-xl w-\[210mm\] min-w-\[210mm\] min-h-\[297mm\] p-\[10mm\] sm:p-\[20mm\] mx-auto text-black print:shadow-none print:m-0 print:p-0 print:max-w-none origin-top-left sm:origin-top print:!zoom-100"/g,
  'className="bg-white text-stone-900 sm:shadow-2xl origin-top-left sm:origin-top w-full sm:w-[210mm] border-none sm:border-2 border-transparent sm:border-stone-200 print:border-none print:w-full print:p-0 print:shadow-none print:!zoom-100 min-h-[max-content] mx-auto p-4 sm:p-[20mm] font-serif"'
);

// We need to add responsive styles to font and text alignments.
// Top titles 
// TỔNG CỤC LOGISTICS ...
// 
// <div className="text-center font-bold text-\[15px\] leading-tight">
code = code.replace(
  /text-\[18px\]/g,
  'text-[16px] sm:text-[18px]'
);
code = code.replace(
  /text-\[24px\]/g,
  'text-[18px] sm:text-[24px]'
);

fs.writeFileSync('src/components/EngineInspectionBeforeRepairForm.tsx', code);
