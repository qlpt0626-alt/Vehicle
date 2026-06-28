const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Container
content = content.replace(
  'className="flex border-b border-stone-200 mt-6 mb-6 bg-white rounded-xl shadow-sm p-1.5 gap-1 font-sans"',
  'className="flex border-b border-stone-200 mt-6 mb-6 bg-white rounded-xl shadow-sm p-1 flex-row gap-0.5 md:gap-1 font-sans w-full max-w-full overflow-hidden"'
);

// Buttons
content = content.replace(
  /className=\{`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 text-xs md:text-sm font-bold rounded-lg transition-all cursor-pointer \$\{/g,
  'className={`flex-1 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2.5 py-1.5 md:py-3 px-0.5 md:px-4 text-[9px] sm:text-xs md:text-sm leading-[1.1] text-center font-bold rounded-lg transition-all cursor-pointer break-words ${'
);

// We want to force the text to wrap inside the buttons instead of causing horizontal scroll.
// text-[9px] on very small screens, sm:text-xs, md:text-sm

fs.writeFileSync('src/App.tsx', content);
