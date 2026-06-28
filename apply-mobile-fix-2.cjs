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

  // Change paper wrapper back to w-full max-w-[210mm] so it fits the screen width and doesn't force a horizontal scroll
  content = content.replace(
    'className="bg-white shadow-xl w-[210mm] min-w-[210mm] min-h-[297mm] p-[10mm] sm:p-[20mm] mx-auto text-black print:shadow-none print:m-0 print:p-0 print:max-w-none origin-top-left sm:origin-top print:!zoom-100"',
    'className="bg-white shadow-xl w-full max-w-[210mm] min-h-[297mm] p-4 sm:p-[20mm] mx-auto text-black print:shadow-none print:m-0 print:p-0 print:max-w-none origin-top print:!zoom-100"'
  );

  // We should also make sure tables or inner content have max-w-full 
  // so they don't break the layout. Actually Tailwind class flex-1 overflow-auto w-full is on the container:
  content = content.replace(
    'className="flex-1 overflow-auto w-full flex sm:justify-center p-2 sm:p-8 print:p-0 print:block"',
    'className="flex-1 overflow-y-auto overflow-x-hidden w-full flex justify-center p-2 sm:p-8 print:p-0 print:block"'
  );

  fs.writeFileSync(file, content);
  console.log(`Updated layout for ${file}`);
}
