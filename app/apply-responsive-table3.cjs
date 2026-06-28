const fs = require('fs');
let code = fs.readFileSync('src/components/DetailedSelectionProtocolForm.tsx', 'utf-8');

// The `tr` has: `className="h-auto sm:h-10 hover:bg-stone-50/50 flex flex-col sm:table-row mb-2 sm:mb-0"`
code = code.replace(
  /className="h-auto sm:h-10 hover:bg-stone-50\/50 flex flex-col sm:table-row mb-2 sm:mb-0"/g, 
  'className="flex flex-col sm:table-row hover:bg-stone-50/50 transition-colors border-b-2 sm:border-b border-stone-300 sm:border-black mb-2 sm:mb-0 h-auto sm:h-10"'
);

// The TT column: `<td className="hidden sm:table-cell border border-black p-1 text-center font-medium bg-stone-50/20">{currentIndex}</td>`
// It's already fine.

// The Name column: 
code = code.replace(
  /<td className="border-t border-x sm:border sm:border-l-0 border-stone-300 sm:border-black p-2 sm:pl-4 cursor-default select-none bg-stone-100 sm:bg-stone-50\/20 font-bold sm:font-normal">/g,
  '<td className="py-2.5 px-2 sm:px-3 sm:border-r sm:border-black font-medium text-stone-800 text-[11pt] sm:text-[14px] leading-tight sm:leading-normal bg-stone-100 sm:bg-stone-50/20 border-t border-x border-stone-300 sm:border-y-0 sm:border-l-0">'
);
code = code.replace(
  /<span className="sm:hidden font-normal text-stone-500 text-xs ml-1">\(Biên chế: \{item.quantity\}\)<\/span>/g,
  '<span className="sm:hidden text-stone-500 font-normal text-[9pt] ml-1">(Biên chế: {item.quantity})</span>'
);

// The inputs are inside `td`s. Let's find them: `<td className="border-x border-b sm:border border-stone-300 sm:border-black p-1 flex sm:table-cell items-center justify-between">`
// We should make them have a white bg on mobile, and amber/emerald hover styles as is, but maybe matching the padding.
code = code.replace(
  /<td className="border-x border-b sm:border border-stone-300 sm:border-black p-1 flex sm:table-cell items-center justify-between">/g,
  '<td className="py-1.5 px-2 sm:p-1 text-center bg-white sm:bg-transparent border-x border-b sm:border border-stone-300 sm:border-black flex sm:table-cell items-center justify-between">'
);

// Input classes:
code = code.replace(
  /className="w-16 sm:w-full h-8 px-1 text-center bg-stone-50 sm:bg-transparent border border-stone-300 hover:border-emerald-400 focus:border-emerald-500 focus:bg-white sm:focus:bg-emerald-50 focus:outline-none cursor-pointer rounded-sm"/g,
  'className="w-20 sm:w-full h-8 px-1 text-center bg-white sm:bg-transparent border border-stone-300 sm:border-transparent hover:border-stone-800 focus:border-stone-800 focus:bg-white sm:focus:bg-emerald-50 focus:outline-none cursor-pointer rounded px-2 sm:px-1 py-1.5 sm:py-0"'
);

fs.writeFileSync('src/components/DetailedSelectionProtocolForm.tsx', code);
