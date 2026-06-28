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
    /className="flex flex-col sm:table-row hover:bg-stone-50\/50 transition-colors border-b-2 sm:border-b border-stone-300 sm:border-black mb-2 sm:mb-0 h-auto sm:h-12 block sm:table-row"/g,
    'className="flex flex-col sm:table-row hover:bg-stone-50/50 transition-colors border-b-2 sm:border-b border-stone-300 sm:border-black mb-2 sm:mb-0 h-auto sm:h-auto"'
  );

  fs.writeFileSync(file, code);
}
