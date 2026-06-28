const fs = require('fs');

const fixTable = (file) => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/px-4/g, 'px-1 sm:px-4');
  content = content.replace(/py-3/g, 'py-2 sm:py-3');
  content = content.replace(/py-4/g, 'py-2 sm:py-4');
  fs.writeFileSync(file, content);
  console.log(`Fixed table padding in ${file}`);
};

fixTable('src/components/UserManagement.tsx');
fixTable('src/components/TrashTab.tsx');
fixTable('src/components/RepairRecordsTab.tsx');
fixTable('src/components/ReceptionTab.tsx');

