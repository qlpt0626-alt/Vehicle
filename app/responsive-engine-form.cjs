const fs = require('fs');
let code = fs.readFileSync('src/components/EngineInspectionBeforeRepairForm.tsx', 'utf-8');

// Apply mobile responsive layout to EngineInspectionBeforeRepairForm

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

fs.writeFileSync('src/components/EngineInspectionBeforeRepairForm.tsx', code);
