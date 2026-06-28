const fs = require('fs');

const replaceInFile = (filePath, searchValue, replaceValue) => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.split(searchValue).join(replaceValue);
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
};

// Replace horizontally scrolling pills with wrapping flex elements
replaceInFile(
  'src/components/RepairRecordsTab.tsx',
  'flex w-full overflow-x-auto gap-2 mb-6 pb-2 shrink-0 border-b border-stone-200 hide-scrollbar',
  'flex w-full flex-wrap gap-2 mb-6 pb-2 shrink-0 border-b border-stone-200'
);

replaceInFile(
  'src/components/UserManagement.tsx',
  '<div className="overflow-x-auto">',
  '<div>'
);

replaceInFile(
  'src/components/TrashTab.tsx',
  '<div className="overflow-x-auto">',
  '<div>'
);

replaceInFile(
  'src/components/MilitaryInspectionForm.tsx',
  '<div className="overflow-x-auto">',
  '<div>'
);

replaceInFile(
  'src/components/DamageProtocolForm.tsx',
  'overflow-x-auto',
  'overflow-hidden'
);
