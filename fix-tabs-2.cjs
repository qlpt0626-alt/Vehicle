const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /className=\{`flex-1 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2\.5 py-1\.5 md:py-3 px-0\.5 md:px-4 text-\[9px\] sm:text-xs md:text-sm leading-\[1\.1\] text-center font-bold rounded-lg transition-all cursor-pointer break-words \$\{/g,
  'className={`flex-1 min-w-0 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2.5 py-1.5 md:py-3 px-0.5 md:px-4 text-[9px] w-[50px] sm:w-auto sm:text-[11px] md:text-sm leading-[1.2] whitespace-normal text-center font-bold rounded-lg transition-all cursor-pointer break-words ${'
);

fs.writeFileSync('src/App.tsx', content);
