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

  // Change initial state of zoom
  content = content.replace(
    'const [zoom, setZoom] = useState(100);',
    `const [zoom, setZoom] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 800) {
      return Math.max(30, Math.floor((window.innerWidth) / 7.94));
    }
    return 100;
  });`
  );

  // Restore the fixed A4 width but with our calculated zoom, it won't overflow
  content = content.replace(
    'className="bg-white shadow-xl w-full max-w-[210mm] min-h-[297mm] p-4 sm:p-[20mm] mx-auto text-black print:shadow-none print:m-0 print:p-0 print:max-w-none origin-top print:!zoom-100"',
    'className="bg-white shadow-xl w-[210mm] min-w-[210mm] min-h-[297mm] p-[10mm] sm:p-[20mm] mx-auto text-black print:shadow-none print:m-0 print:p-0 print:max-w-none origin-top-left sm:origin-top print:!zoom-100"'
  );

  // Re-hide horizontal overflow entirely
  content = content.replace(
    /className="flex-1 overflow-[^"]+"/,
    'className="flex-1 overflow-y-auto overflow-x-hidden w-full flex sm:justify-center p-2 sm:p-8 print:p-0 print:block"'
  );

  fs.writeFileSync(file, content);
  console.log('Processed ' + file);
}
