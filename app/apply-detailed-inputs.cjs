const fs = require('fs');
let code = fs.readFileSync('src/components/DetailedSelectionProtocolForm.tsx', 'utf-8');

[
  { field: 'missing', label: 'Thiếu' },
  { field: 'replace', label: 'Hỏng thay' },
  { field: 'restore', label: 'Phục hồi' },
  { field: 'repair', label: 'Sửa chữa' },
  { field: 'reuse', label: 'Dùng lại' },
].forEach(({ field, label }) => {
  // We'll replace the full <td> block
  const regex = new RegExp(
    `<td className="border border-black p-1">\\s*<input\\s*type="number" min="0" placeholder="0"\\s*className="w-full h-8 px-1 text-center bg-transparent border border-stone-300 hover:border-emerald-400 focus:border-emerald-500 focus:bg-emerald-50 focus:outline-none cursor-pointer rounded-sm"\\s*value=\\{formData\\[currentIndex\\.toString\\(\\)\\]\\?\\.${field} \\|\\| ''\\}\\s*onChange=\\{\\(e\\) => handleInputChange\\(currentIndex, '${field}', e\\.target\\.value\\)\\}\\s*/>\\s*</td>`,
    'g'
  );
  
  const replacement = `<td className="py-1.5 px-2 sm:p-1 text-center bg-white sm:bg-transparent border-x border-b sm:border border-stone-300 sm:border-black flex sm:table-cell items-center justify-between">
    <span className="sm:hidden text-xs text-stone-500 font-medium ml-1">${label}</span>
    <input 
      type="number" min="0" placeholder="0"
      className="w-20 sm:w-full h-8 px-1 text-center bg-white sm:bg-transparent border border-stone-300 sm:border-transparent hover:border-stone-800 focus:border-stone-800 focus:bg-white sm:focus:bg-emerald-50 focus:outline-none cursor-pointer rounded px-2 sm:px-1 py-1.5 sm:py-0" 
      value={formData[currentIndex.toString()]?.${field} || ''}
      onChange={(e) => handleInputChange(currentIndex, '${field}', e.target.value)}
    />
  </td>`;
  
  code = code.replace(regex, replacement);
});

fs.writeFileSync('src/components/DetailedSelectionProtocolForm.tsx', code);
