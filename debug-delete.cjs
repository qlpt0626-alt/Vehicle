const fs = require('fs');
let content = fs.readFileSync('src/components/EngineInspectionBeforeRepairForm.tsx', 'utf8');
const searchPattern = /  const handleDelete = async \(\) => \{\r?\n    let confirmed = false;/g;
console.log('Match?', searchPattern.test(content));
