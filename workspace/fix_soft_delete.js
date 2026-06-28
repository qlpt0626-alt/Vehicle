const fs = require('fs');
const glob = require('glob');

const componentsPattern = 'src/components/**/*.tsx';
const files = glob.sync(componentsPattern);

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
