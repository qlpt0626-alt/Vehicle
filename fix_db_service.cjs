const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'services', 'dbService.ts');

const searchStr = /deletedBy:\s*uid/g;
const replacementStr = `deletedBy: uid,
      deletedByName: currentUser?.fullName || currentUser?.username || 'Người dùng',
      deletedByRole: currentUser?.role || 'Không xác định'`;

let content = fs.readFileSync(file, 'utf8');

if (searchStr.test(content)) {
  content = content.replace(searchStr, replacementStr);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated dbService.ts');
}
