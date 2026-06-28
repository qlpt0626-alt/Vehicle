const fs = require('fs');

const files = [
  'src/components/TaskReportForm.tsx',
  'src/components/TaskPlanForm.tsx'
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

  // Apply the same rigid layout so CSS zoom works proportionally
  content = content.replace(
    'className="bg-white shadow-xl max-w-[210mm] w-full min-h-[297mm] p-[20mm] mx-auto text-black print:shadow-none print:m-0 print:p-0 print:max-w-none origin-top print:!zoom-100 relative"',
    'className="bg-white shadow-xl w-[210mm] min-w-[210mm] min-h-[297mm] p-[10mm] sm:p-[20mm] mx-auto text-black print:shadow-none print:m-0 print:p-0 print:max-w-none origin-top-left sm:origin-top print:!zoom-100 relative"'
  );

  // Hide horizontal scroll
  content = content.replace(
    /className="flex-1 overflow-[^"]+"/,
    'className="flex-1 overflow-y-auto overflow-x-hidden w-full flex sm:justify-center p-2 sm:p-8 print:p-0 print:block"'
  );

  fs.writeFileSync(file, content);
  console.log('Processed ' + file);
}
