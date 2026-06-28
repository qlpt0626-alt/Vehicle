const fs = require('fs');
let code = fs.readFileSync('src/components/DetailedSelectionProtocolForm.tsx', 'utf-8');
code = code.replace(/className="flex-1 w-full sm:w-auto overflow-y-auto overflow-x-hidden w-full/g, 'className="flex-1 overflow-y-auto overflow-x-hidden w-full');
fs.writeFileSync('src/components/DetailedSelectionProtocolForm.tsx', code);
