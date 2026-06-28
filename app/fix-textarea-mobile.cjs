const fs = require('fs');

const files = [
  'src/components/EngineInspectionBeforeRepairForm.tsx',
  'src/components/InteriorInspectionBeforeRepairForm.tsx',
  'src/components/BodyInspectionBeforeRepairForm.tsx',
  'src/components/PaintInspectionBeforeRepairForm.tsx',
  'src/components/GeneralDisassemblyRepairForm.tsx',
  'src/components/EngineComponentDisassemblyForm.tsx',
  'src/components/EngineComponentRepairForm.tsx',
  'src/components/PartsCleaningRepairForm.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let code = fs.readFileSync(file, 'utf-8');

  code = code.replace(
    /className="w-full h-full min-h-\[36px\] bg-transparent outline-none px-2 py-2 text-center font-bold text-emerald-700 print:text-black"/g,
    'className="w-full h-full min-h-[36px] sm:min-h-[auto] bg-stone-50 sm:bg-transparent border border-stone-200 sm:border-transparent outline-none px-3 sm:px-2 py-2 text-left sm:text-center rounded sm:rounded-none font-bold text-stone-800 sm:text-emerald-700 print:text-black"'
  );

  fs.writeFileSync(file, code);
  console.log('Processed Textarea styling', file);
}
