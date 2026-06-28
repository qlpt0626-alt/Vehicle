import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function verifyRepairForms() {
  const ifSnap = await getDocs(collection(db, 'repairForms'));
  let map = new Map();
  ifSnap.docs.forEach(doc => {
      let data = doc.data();
      if (data.isDeleted === true || data.isDeleted === 'true') {
          let f = { id: doc.id, ...doc.data() };
          let finalId = f.id;
          
          let key = `REPAIR_FORM-${finalId}`;
          if (!map.has(key)) map.set(key, []);
          map.get(key).push({docId: doc.id, ...data});
      }
  });

  map.forEach((docs, key) => {
      if (docs.length > 1) {
          console.log(`DUPLICATE KEY FOUND: ${key}`);
          console.log("Documents causing this:", docs.map(d => d.docId));
      }
  });
  console.log("Done repairForms");
}

verifyRepairForms().catch(console.error).finally(()=>process.exit(0));
