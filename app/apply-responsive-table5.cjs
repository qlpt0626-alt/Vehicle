const fs = require('fs');
let code = fs.readFileSync('src/components/DetailedSelectionProtocolForm.tsx', 'utf-8');

code = code.replace(
  /style=\{\{ fontFamily: '"Times New Roman", Times, serif', width: typeof window !== 'undefined' && window\.innerWidth < 800 \? '100%' : '260mm', minHeight: typeof window !== 'undefined' && window\.innerWidth < 800 \? '100%' : '350mm' \}\}/g,
  `style={{ fontFamily: '"Times New Roman", Times, serif', width: typeof window !== 'undefined' && window.innerWidth < 800 ? '100%' : '260mm', minHeight: typeof window !== 'undefined' && window.innerWidth < 800 ? '100%' : '350mm', padding: typeof window !== 'undefined' && window.innerWidth < 800 ? '10mm 4mm' : '20mm', marginRight: 'auto', marginLeft: 'auto' }}`
);

// We need to just override `p-4 sm:p-8 md:p-12` style to be empty so it uses the wrapping inline style... actually let's remove inline styling from inside the content div.
code = code.replace(
  /<div className="p-4 sm:p-8 md:p-12 flex flex-col gap-6 text-black print:p-0" style=\{\{ padding: typeof window !== "undefined" && window\.innerWidth < 800 \? "10mm 4mm" : undefined \}\}>/g,
  '<div className="flex flex-col gap-6 text-black print:p-0">'
);
code = code.replace(
  /<div className="p-8 md:p-12 flex flex-col gap-6 text-black print:p-0">/g,
  '<div className="flex flex-col gap-6 text-black print:p-0">'
);

fs.writeFileSync('src/components/DetailedSelectionProtocolForm.tsx', code);
