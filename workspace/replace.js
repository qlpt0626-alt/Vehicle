import fs from 'fs';

const path = 'src/services/dbService.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/\['pho_dai_doi_truong'\]\.includes/g, "['admin'].includes");
content = content.replace(/currentUser\?\.role !== 'pho_dai_doi_truong'/g, "currentUser?.role !== 'admin'");

fs.writeFileSync(path, content, 'utf8');
console.log('Replaced successfully');
