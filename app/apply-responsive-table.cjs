const fs = require('fs');
let code = fs.readFileSync('src/components/DetailedSelectionProtocolForm.tsx', 'utf-8');

// Thead
code = code.replace(/<thead>/, '<thead className="hidden sm:table-header-group">');

// Group names
code = code.replace(/<tr className="bg-stone-50 font-bold">/g, '<tr className="bg-stone-50 font-bold block sm:table-row">');
code = code.replace(/<td colSpan=\{8\} className="border border-black p-2 text-left">\{group.name\}<\/td>/g, '<td colSpan={8} className="border-b border-x sm:border border-stone-300 sm:border-black p-2 text-left block sm:table-cell">{group.name}</td>');

// Subgroup names
code = code.replace(/<tr className="bg-stone-50 font-bold italic">/g, '<tr className="bg-stone-50 font-bold italic block sm:table-row">');
code = code.replace(/<td colSpan=\{8\} className="border border-black p-2 text-left pl-6">\{subgroup.name\}<\/td>/g, '<td colSpan={8} className="border-b border-x sm:border border-stone-300 sm:border-black p-2 text-left pl-6 block sm:table-cell">{subgroup.name}</td>');

// Item row
code = code.replace(/<tr key=\{item.name\} className="h-10 hover:bg-stone-50\/50">/g, '<tr key={item.name} className="h-auto sm:h-10 hover:bg-stone-50/50 flex flex-col sm:table-row mb-2 sm:mb-0">');

// TT
code = code.replace(/<td className="border border-black p-1 text-center font-medium bg-stone-50\/20">\{currentIndex\}<\/td>/g, '<td className="hidden sm:table-cell border border-black p-1 text-center font-medium bg-stone-50/20">{currentIndex}</td>');

// Name
code = code.replace(/<td className="border border-black p-2 pl-4 cursor-default select-none bg-stone-50\/20">\{item.name\}<\/td>/g, '<td className="border-t border-x sm:border sm:border-l-0 border-stone-300 sm:border-black p-2 sm:pl-4 cursor-default select-none bg-stone-100 sm:bg-stone-50/20 font-bold sm:font-normal"><span className="sm:hidden font-bold mr-1">{currentIndex}.</span>{item.name}<span className="sm:hidden font-normal text-stone-500 text-xs ml-1">(Biên chế: {item.quantity})</span></td>');

// Quantity
code = code.replace(/<td className="border border-black p-1 text-center font-bold text-stone-600 bg-stone-50\/20">\{item.quantity\}<\/td>/g, '<td className="hidden sm:table-cell border border-black p-1 text-center font-bold text-stone-600 bg-stone-50/20">{item.quantity}</td>');

// 5 inputs
// Instead of modifying them directly, let's wrap them in a flex container on mobile
// In react, we can't easily convert 5 tds into 1 td with a flex.
// But we can add a mobile label to each td, and style them as flex items.
// Thiếu
code = code.replace(
  /<td className="border border-black p-1">\s*<input([^>]*)value=\{formData\[currentIndex\.toString\(\)\]\?\.missing \|\| ''\}([^>]*)>\s*<\/td>/g, 
  '<td className="border-x border-b sm:border border-stone-300 sm:border-black p-1 flex sm:table-cell items-center justify-between"><span className="sm:hidden text-xs text-stone-500 font-medium ml-1">Thiếu</span><input$1value={formData[currentIndex.toString()]?.missing || \'\'}$2 className="w-16 sm:w-full h-8 px-1 text-center bg-stone-50 sm:bg-transparent border border-stone-300 hover:border-emerald-400 focus:border-emerald-500 focus:bg-white sm:focus:bg-emerald-50 focus:outline-none cursor-pointer rounded-sm" /></td>'
);

// Hỏng thay
code = code.replace(
  /<td className="border border-black p-1">\s*<input([^>]*)value=\{formData\[currentIndex\.toString\(\)\]\?\.replace \|\| ''\}([^>]*)>\s*<\/td>/g, 
  '<td className="border-x border-b sm:border border-stone-300 sm:border-black p-1 flex sm:table-cell items-center justify-between"><span className="sm:hidden text-xs text-stone-500 font-medium ml-1">Hỏng thay</span><input$1value={formData[currentIndex.toString()]?.replace || \'\'}$2 className="w-16 sm:w-full h-8 px-1 text-center bg-stone-50 sm:bg-transparent border border-stone-300 hover:border-emerald-400 focus:border-emerald-500 focus:bg-white sm:focus:bg-emerald-50 focus:outline-none cursor-pointer rounded-sm" /></td>'
);

// Phục hồi
code = code.replace(
  /<td className="border border-black p-1">\s*<input([^>]*)value=\{formData\[currentIndex\.toString\(\)\]\?\.restore \|\| ''\}([^>]*)>\s*<\/td>/g, 
  '<td className="border-x border-b sm:border border-stone-300 sm:border-black p-1 flex sm:table-cell items-center justify-between"><span className="sm:hidden text-xs text-stone-500 font-medium ml-1">Phục hồi</span><input$1value={formData[currentIndex.toString()]?.restore || \'\'}$2 className="w-16 sm:w-full h-8 px-1 text-center bg-stone-50 sm:bg-transparent border border-stone-300 hover:border-emerald-400 focus:border-emerald-500 focus:bg-white sm:focus:bg-emerald-50 focus:outline-none cursor-pointer rounded-sm" /></td>'
);

// S/C
code = code.replace(
  /<td className="border border-black p-1">\s*<input([^>]*)value=\{formData\[currentIndex\.toString\(\)\]\?\.repair \|\| ''\}([^>]*)>\s*<\/td>/g, 
  '<td className="border-x border-b sm:border border-stone-300 sm:border-black p-1 flex sm:table-cell items-center justify-between"><span className="sm:hidden text-xs text-stone-500 font-medium ml-1">Sửa chữa</span><input$1value={formData[currentIndex.toString()]?.repair || \'\'}$2 className="w-16 sm:w-full h-8 px-1 text-center bg-stone-50 sm:bg-transparent border border-stone-300 hover:border-emerald-400 focus:border-emerald-500 focus:bg-white sm:focus:bg-emerald-50 focus:outline-none cursor-pointer rounded-sm" /></td>'
);

// Dùng lại
code = code.replace(
  /<td className="border border-black p-1">\s*<input([^>]*)value=\{formData\[currentIndex\.toString\(\)\]\?\.reuse \|\| ''\}([^>]*)>\s*<\/td>/g, 
  '<td className="border-x border-b sm:border border-stone-300 sm:border-black p-1 flex sm:table-cell items-center justify-between"><span className="sm:hidden text-xs text-stone-500 font-medium ml-1">Dùng lại</span><input$1value={formData[currentIndex.toString()]?.reuse || \'\'}$2 className="w-16 sm:w-full h-8 px-1 text-center bg-stone-50 sm:bg-transparent border border-stone-300 hover:border-emerald-400 focus:border-emerald-500 focus:bg-white sm:focus:bg-emerald-50 focus:outline-none cursor-pointer rounded-sm" /></td>'
);

fs.writeFileSync('src/components/DetailedSelectionProtocolForm.tsx', code);
