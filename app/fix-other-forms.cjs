const fs = require('fs');

const files = [
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
  
  // The table container
  code = code.replace(
    /<table className="w-full border-collapse border border-black text-\[15px\]">/g,
    '<table className="w-full border-collapse border-y border-x sm:border border-stone-300 sm:border-black text-[15px]">'
  );

  // The thead
  code = code.replace(
    /<thead>/g,
    '<thead className="hidden sm:table-header-group">'
  );

  // We need to change td in category row
  code = code.replace(
    /<tr className="bg-stone-50 print:bg-stone-100 font-bold">/g,
    '<tr className="bg-stone-50 print:bg-stone-100 font-bold block sm:table-row">'
  );
  code = code.replace(
    /<td colSpan=\{5\} className="border border-black px-4 py-2 text-left text-\[14px\]">/g,
    '<td colSpan={5} className="border-y border-x sm:border border-stone-300 sm:border-black px-4 py-2 text-left text-[14px] mt-4 sm:mt-0 block sm:table-cell">'
  );

  // Main data row
  code = code.replace(
    /<tr>\s*<td className="border border-black px-2 py-2 text-center">\{index \+ 1\}<\/td>\s*<td className="border border-black px-2 py-2">\{item.content\}<\/td>\s*<td className="border border-black px-2 py-2 text-center">\{item.unit\}<\/td>\s*<td className="border border-black px-2 py-2 text-center">\{item.requirement\}<\/td>\s*<td className="border border-black p-0">/g,
    `<tr className="flex flex-col sm:table-row hover:bg-stone-50/50 transition-colors border-b-2 sm:border-b border-stone-300 sm:border-black mb-2 sm:mb-0 h-auto sm:h-12 block sm:table-row">
                          <td className="hidden sm:table-cell border border-black px-2 py-2 text-center">{index + 1}</td>
                          <td className="border-t border-x sm:border-y-0 sm:border-l-0 sm:border-r border-stone-300 sm:border-black p-2.5 sm:px-2 font-medium bg-stone-100 sm:bg-transparent">
                            <span className="sm:hidden font-bold mr-1">{index + 1}.</span>
                            {item.content}
                          </td>
                          <td className="border-x border-b sm:border border-stone-300 sm:border-black p-2 sm:p-2 flex sm:table-cell items-center justify-between bg-white sm:bg-transparent">
                            <span className="sm:hidden text-xs text-stone-500 font-medium ml-1">Đơn vị đo</span>
                            <span className="text-right sm:text-center text-stone-800">{item.unit}</span>
                          </td>
                          <td className="border-x border-b sm:border border-stone-300 sm:border-black p-2 flex sm:table-cell items-center justify-between bg-white sm:bg-transparent">
                            <span className="sm:hidden text-xs text-stone-500 font-medium ml-1">Yêu cầu</span>
                            <span className="text-right sm:text-center text-stone-800 font-medium sm:font-normal">{item.requirement}</span>
                          </td>
                          <td className="border-x border-b sm:border border-stone-300 sm:border-black p-1 flex sm:table-cell flex-col sm:flex-row items-stretch sm:items-center justify-between bg-white sm:bg-transparent">
                            <span className="sm:hidden text-xs text-stone-500 font-medium ml-2 mt-1 mb-1">Thực tế</span>
`
  );

  code = code.replace(
    /text-\[18px\]/g,
    'text-[16px] sm:text-[18px]'
  );
  code = code.replace(
    /text-\[24px\]/g,
    'text-[18px] sm:text-[24px]'
  );

  fs.writeFileSync(file, code);
  console.log('Processed', file);
}
