const fs = require('fs');
let code = fs.readFileSync('src/components/MilitaryInspectionForm.tsx', 'utf-8');

// The field wrappers look like: <div className="flex items-center gap-1.5">
code = code.replace(/<div className="flex items-center gap-1\.5">(\s*<span className="font-bold text-stone-700 whitespace-nowrap">.*?<\/span>\s*<input)/g, '<div className="flex flex-col sm:flex-row sm:items-center items-start gap-1 sm:gap-1.5 w-full">$1');
code = code.replace(/<div className="flex flex-row sm:items-center items-start/g, '<div className="flex flex-col sm:flex-row sm:items-center items-start');
code = code.replace(/<div className="flex items-center gap-1\.5">(\s*<span className="font-bold text-stone-700 whitespace-nowrap">.*?<\/span>\s*<span)/g, '<div className="flex flex-col sm:flex-row sm:items-center items-start gap-1 sm:gap-1.5 w-full">$1');

// Wait, I manually changed Tên xe to flex-wrap sm:flex-nowrap, I should capture it too
code = code.replace(/<div className="flex items-center gap-1\.5 flex-wrap sm:flex-nowrap">/g, '<div className="flex flex-col sm:flex-row sm:items-center items-start gap-1 sm:gap-1.5 w-full">');

// For the fields with flex-1, we should also give w-full so they expand properly on mobile if flex-col
code = code.replace(/className="flex-1 /g, 'className="flex-1 w-full sm:w-auto ');

fs.writeFileSync('src/components/MilitaryInspectionForm.tsx', code);
