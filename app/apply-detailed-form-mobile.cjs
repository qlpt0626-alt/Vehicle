const fs = require('fs');
let code = fs.readFileSync('src/components/DetailedSelectionProtocolForm.tsx', 'utf-8');

code = code.replace(/<div className="flex gap-2">/g, '<div className="flex flex-col sm:flex-row gap-0.5 sm:gap-2 sm:items-center">');
code = code.replace(/<div className="flex gap-2 items-center relative group">/g, '<div className="flex flex-col sm:flex-row gap-0.5 sm:gap-2 sm:items-center relative group">');
code = code.replace(/<div className="flex gap-2 items-center">/g, '<div className="flex flex-col sm:flex-row gap-0.5 sm:gap-2 sm:items-center">');
code = code.replace(/<div className="flex gap-4 items-center">/g, '<div className="flex flex-col sm:flex-row gap-0.5 sm:gap-4 sm:items-center">');

// We also need to fix the inputs for "Thực tế" side-by-side SM, CHASSIS.
// "<div className="flex gap-2 items-center">" -> "<div className="flex flex-col sm:flex-row gap-0.5 sm:gap-2 sm:items-center">"
// For "flex-1 w-full sm:w-auto" -> "flex-1 w-full"
code = code.replace(/className="flex-1 w-full sm:w-auto/g, 'className="flex-1 w-full');

fs.writeFileSync('src/components/DetailedSelectionProtocolForm.tsx', code);
