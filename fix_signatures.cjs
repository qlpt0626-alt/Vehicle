const fs = require('fs');
const path = require('path');

const dir = './src/components';
const files = fs.readdirSync(dir).filter(f => f.includes('Form.tsx'));

function makeSafeProp(str) {
  return 'sign_' + Buffer.from(str).toString('hex');
}

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  const regex = /<p className="font-bold text-\[15px\] mb-24">(.*?)<\/p>/g;
  
  content = content.replace(regex, (match, p1) => {
    changed = true;
    const propName = `sign_${p1.replace(/\s+/g, '_').toLowerCase()}`;
    // But since it might contain unicode, it's safer to just use ascii if possible or just standard utf8 string in bracket access.
    // Actually, object keys can be any string. So `formData['sign_${p1}']` works perfect.
    return `<p className="font-bold text-[15px] mb-12">${p1}</p>
              <input 
                type="text" 
                className="w-full text-center outline-none bg-transparent font-bold text-[15px] print:text-black" 
                value={formData['sign_${p1}'] || ''} 
                onChange={(e) => setFormData({...formData, 'sign_${p1}': e.target.value})}
                placeholder="..."
              />`;
  });

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}
