const fs = require('fs');
let code = fs.readFileSync('src/components/DetailedSelectionProtocolForm.tsx', 'utf-8');

code = code.replace(
  /<td colSpan=\{8\} className="border-b border-x sm:border border-stone-300 sm:border-black p-2 text-left block sm:table-cell">\{group.name\}<\/td>/g,
  '<td colSpan={8} className="border-y border-x sm:border border-stone-300 sm:border-black py-2.5 px-3 sm:p-2 text-left block sm:table-cell mt-4 sm:mt-0 text-[12pt] sm:text-[14px]">I. {group.name}</td>'
);

code = code.replace(
  /<td colSpan=\{8\} className="border-b border-x sm:border border-stone-300 sm:border-black p-2 text-left pl-6 block sm:table-cell">\{subgroup.name\}<\/td>/g,
  '<td colSpan={8} className="border-y border-x sm:border border-stone-300 sm:border-black py-2 px-3 sm:p-2 text-left sm:pl-6 block sm:table-cell mt-2 sm:mt-0 bg-stone-100 sm:bg-transparent text-[11pt] sm:text-[14px]">{subgroup.name}</td>'
);

// We need to number the group properly? The original didn't have "I.", it was just group.name. But Military has roman numerals. Let's just do group.name without prefix since it's already upper case maybe.
code = code.replace(
  />I\. \{group.name\}<\/td>/g,
  '>{group.name}</td>'
);

// Let's modify the Table container as well
// In MilitaryInspectionForm:
// <div className="flex-1 overflow-y-auto overflow-x-hidden w-full flex sm:justify-center p-0 md:p-8 print:p-0 print:block bg-stone-100 sm:bg-stone-50/80">
// In DetailedSelection:
// <div className="flex-1 w-full sm:w-auto overflow-auto p-4 md:p-8 flex justify-center bg-white sm:bg-stone-50/80 print:p-0 print:bg-white custom-scrollbar">

code = code.replace(
  /<div className="flex-1 w-full sm:w-auto overflow-auto p-4 md:p-8 flex justify-center bg-white sm:bg-stone-50\/80 print:p-0 print:bg-white custom-scrollbar">/g,
  '<div className="flex-1 w-full sm:w-auto overflow-y-auto overflow-x-hidden w-full flex sm:justify-center p-0 md:p-8 print:p-0 print:block bg-white sm:bg-stone-50/80 print:bg-white custom-scrollbar">'
);

// A4 Content inner styling
// Military: <div className="bg-white text-stone-900 sm:shadow-2xl origin-top-left sm:origin-top w-full sm:w-auto border-none sm:border-2 border-transparent sm:border-stone-200 print:border-none print:w-full print:p-0 print:shadow-none print:!zoom-100 min-h-[max-content]" style="... zoom: ..., width: ..., minHeight: ..., padding: ...">
// Detailed: 
code = code.replace(
  /className="bg-white shadow-xl w-\[800px\] max-w-full flex flex-col mx-auto font-serif"/g,
  'className="bg-white text-stone-900 sm:shadow-2xl origin-top-left sm:origin-top w-full sm:w-auto border-none sm:border-2 border-transparent sm:border-stone-200 print:border-none print:w-full print:p-0 print:shadow-none print:!zoom-100 min-h-[max-content] flex flex-col mx-auto font-serif"'
);

// Detailed style uses: style={{ fontFamily: '"Times New Roman", Times, serif', minHeight: typeof window !== 'undefined' && window.innerWidth < 800 ? '100%' : '1122.5px' }}
code = code.replace(
  /style=\{\{ fontFamily: '"Times New Roman", Times, serif', minHeight: typeof window !== 'undefined' && window\.innerWidth < 800 \? '100%' : '1122\.5px' \}\}/g,
  `style={{ fontFamily: '"Times New Roman", Times, serif', width: typeof window !== 'undefined' && window.innerWidth < 800 ? '100%' : '260mm', minHeight: typeof window !== 'undefined' && window.innerWidth < 800 ? '100%' : '350mm' }}`
);

// Detailed padding: <div className="p-8 md:p-12 flex flex-col gap-6 text-black print:p-0">
code = code.replace(
  /<div className="p-8 md:p-12 flex flex-col gap-6 text-black print:p-0">/g,
  '<div className="p-4 sm:p-8 md:p-12 flex flex-col gap-6 text-black print:p-0" style={{ padding: typeof window !== "undefined" && window.innerWidth < 800 ? "10mm 4mm" : undefined }}>'
);


fs.writeFileSync('src/components/DetailedSelectionProtocolForm.tsx', code);
