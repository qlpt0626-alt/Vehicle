const fs = require('fs');

const files = [
  'src/components/BodyInspectionBeforeRepairForm.tsx',
  'src/components/EngineComponentRepairForm.tsx',
  'src/components/EngineInspectionBeforeRepairForm.tsx',
  'src/components/GeneralDisassemblyRepairForm.tsx',
  'src/components/InteriorInspectionBeforeRepairForm.tsx',
  'src/components/PaintInspectionBeforeRepairForm.tsx',
  'src/components/PartsCleaningRepairForm.tsx',
  'src/components/EngineComponentDisassemblyForm.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // 1. the header bar
  content = content.replace(
    'className="bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between shrink-0 print:hidden"',
    'className="bg-white border-b border-stone-200 px-2 sm:px-4 py-3 flex flex-col sm:flex-row items-center justify-between shrink-0 print:hidden gap-3 sm:gap-0"'
  );

  // 2. the left group
  content = content.replace(
    '<div className="flex items-center gap-4">',
    '<div className="flex items-center justify-between w-full sm:w-auto gap-4">'
  );

  // 3. the divider
  content = content.replace(
    '<div className="h-6 w-px bg-stone-200"></div>',
    '<div className="h-6 w-px bg-stone-200 hidden sm:block"></div>'
  );

  // 4. the right group (Buttons) - replace the first occurrence that wraps Xóa button
  const regexRightGroup = /(<\/div>\s*)<div className="flex items-center gap-2">((.|\n)*?>\s*Xóa\s*<\/button>)/m;
  content = content.replace(regexRightGroup, '$1<div className="flex flex-wrap items-center justify-center gap-2 w-full sm:w-auto">$2');

  // 5. form container
  content = content.replace(
    'className="flex-1 overflow-y-auto w-full flex justify-center p-8 print:p-0 print:block"',
    'className="flex-1 overflow-auto w-full flex sm:justify-center p-2 sm:p-8 print:p-0 print:block"'
  );

  // 6. the paper wrapper (enable horizontal scroll on mobile by forcing width)
  content = content.replace(
    'className="bg-white shadow-xl max-w-[210mm] w-full min-h-[297mm] p-[20mm] mx-auto text-black print:shadow-none print:m-0 print:p-0 print:max-w-none origin-top print:!zoom-100"',
    'className="bg-white shadow-xl w-[210mm] min-w-[210mm] min-h-[297mm] p-[10mm] sm:p-[20mm] mx-auto text-black print:shadow-none print:m-0 print:p-0 print:max-w-none origin-top-left sm:origin-top print:!zoom-100"'
  );

  fs.writeFileSync(file, content);
  console.log(`Responsive layout added to ${file}`);
}
