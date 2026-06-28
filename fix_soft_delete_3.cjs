const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src', 'components');
const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.tsx')).map(f => path.join(srcDir, f));

const searchStr = /deletedBy:\s*currentUser\?\.uid\s*\|\|\s*currentUser\?\.username\s*\|\|\s*"unknown",?/g;
const replacementStr = `deletedBy: currentUser?.uid || currentUser?.username || "unknown",
          deletedByName: currentUser?.fullName || currentUser?.username || "Người dùng",
          deletedByRole: currentUser?.role || "Không xác định",`;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (searchStr.test(content)) {
    content = content.replace(searchStr, replacementStr);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated ' + file);
  }
}
