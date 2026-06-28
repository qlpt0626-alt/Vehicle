const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const firebaseConfig = require('./firebase-applet-config.json');
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  try {
    const querySnapshot = await getDocs(collection(db, 'vehicleInspectionForms'));
    const docs = [];
    querySnapshot.forEach(doc => docs.push({ id: doc.id, ...doc.data() }));
    
    const duplicateMap = {};
    docs.filter(d => d.isDeleted !== true).forEach(d => {
      const vId = d.vehicleId;
      if (!vId) return;
      if (!duplicateMap[vId]) duplicateMap[vId] = [];
      duplicateMap[vId].push(d);
    });
    
    let over1 = 0, over2 = 0, over3 = 0;
    for (const vId in duplicateMap) {
      const count = duplicateMap[vId].length;
      if (count === 1) over1++;
      if (count === 2) over2++;
      if (count >= 3) over3++;
    }
    
    console.log('--- BÁO CÁO SỐ LƯỢNG BIÊN BẢN KIỂM CHỌN THEO XE ---');
    console.log('Số xe có 1 biên bản:', over1);
    console.log('Số xe có 2 biên bản:', over2);
    console.log('Số xe có 3 biên bản trở lên:', over3);
    console.log('');
    console.log('--- CÁC XE BỊ TRÙNG LẶP ---');
    
    let foundDup = false;
    for (const vId in duplicateMap) {
      if (duplicateMap[vId].length >= 2) {
        foundDup = true;
        console.log('Vehicle ID: ' + vId);
        duplicateMap[vId].forEach(d => {
          let cAt = d.createdAt;
          if (cAt && cAt.toDate) cAt = cAt.toDate();
          else if (cAt && cAt.seconds) cAt = new Date(cAt.seconds * 1000);
          
          let uAt = d.updatedAt;
          if (uAt && uAt.toDate) uAt = uAt.toDate();
          else if (uAt && uAt.seconds) uAt = new Date(uAt.seconds * 1000);

          console.log('  - docId: ' + d.id);
          console.log('    createdAt: ' + cAt);
          console.log('    updatedAt: ' + uAt);
          console.log('    templateName: ' + d.templateName);
          console.log('    isDeleted: ' + d.isDeleted);
        });
      }
    }
    if (!foundDup) console.log('Không có xe nào bị trùng lặp biên bản!');
  } catch (e) {
    console.error('Error: ' + e.message);
  }
  process.exit(0);
}
run();
